import { runFinalize, toPlatformEnum, FinalizeDeps } from '../../app/onboarding/hooks/finalizeOnboarding';

const baseState = {
  username: 'satoshi', email: null as string | null,
  domain: 'CRYPTO' as const, goal: 'invest', dailyMinutes: 5 as const,
  reminderHour: 9, notificationsEnabled: false,
};

function makeDeps(over: Partial<FinalizeDeps> = {}): FinalizeDeps {
  return {
    apiUrl: 'http://api.test/api',
    getExistingUserId: async () => null,
    persistUser: async () => {},
    clearOnboarding: async () => {},
    navigateToApp: () => {},
    requestPushPermission: async () => true,
    getPushToken: async () => 'ExponentPushToken[xxx]',
    platformOS: 'ios',
    fetchImpl: jest.fn(async (url: string) => {
      if (url.endsWith('/users')) {
        return { ok: true, status: 201, json: async () => ({ data: { id: 'u1', username: 'satoshi' } }) } as any;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as any;
    }),
    ...over,
  };
}

describe('toPlatformEnum', () => {
  it('mappe ios/android vers IOS/ANDROID', () => {
    expect(toPlatformEnum('ios')).toBe('IOS');
    expect(toPlatformEnum('android')).toBe('ANDROID');
    expect(toPlatformEnum('web')).toBe('ANDROID'); // défaut sûr
  });
});

describe('runFinalize', () => {
  it('crée le user puis persiste l’id et navigue', async () => {
    const deps = makeDeps();
    await runFinalize(baseState, deps);
    const urls = (deps.fetchImpl as jest.Mock).mock.calls.map((c) => c[0]);
    expect(urls).toContain('http://api.test/api/users');
    expect(urls).toContain('http://api.test/api/users/u1'); // PATCH prefs
  });

  it('est idempotent : ne recrée pas si un user existe déjà', async () => {
    const deps = makeDeps({ getExistingUserId: async () => 'existing' });
    await runFinalize(baseState, deps);
    const postUsers = (deps.fetchImpl as jest.Mock).mock.calls
      .filter((c) => c[0] === 'http://api.test/api/users' && c[1]?.method === 'POST');
    expect(postUsers).toHaveLength(0);
  });

  it('enregistre le push token sur le BON endpoint avec platform', async () => {
    const deps = makeDeps();
    await runFinalize({ ...baseState, notificationsEnabled: true }, deps);
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => c[0] === 'http://api.test/api/notifications/register-token');
    expect(call).toBeTruthy();
    const body = JSON.parse(call[1].body);
    expect(body).toMatchObject({ userId: 'u1', token: 'ExponentPushToken[xxx]', platform: 'IOS' });
  });

  it('ne plante pas si la permission push est refusée', async () => {
    const deps = makeDeps({ requestPushPermission: async () => false });
    await expect(runFinalize({ ...baseState, notificationsEnabled: true }, deps)).resolves.toBeUndefined();
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => c[0] === 'http://api.test/api/notifications/register-token');
    expect(call).toBeFalsy(); // pas d'enregistrement sans permission
  });

  it('propage une erreur claire si la création échoue (409)', async () => {
    const deps = makeDeps({
      fetchImpl: jest.fn(async () => ({ ok: false, status: 409, json: async () => ({ message: 'taken' }) } as any)),
    });
    await expect(runFinalize(baseState, deps)).rejects.toThrow(/taken|déjà pris/i);
  });
});
