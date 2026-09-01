import { runFinalize, toPlatformEnum, FinalizeDeps } from '../../app/onboarding/hooks/finalizeOnboarding';

const baseState = {
  username: 'satoshi',
  email: 'sat@example.com',
  password: 'secret12',
  domain: 'CRYPTO' as const,
  goal: 'invest',
  dailyMinutes: 5 as const,
  reminderHour: 9,
  notificationsEnabled: false,
  demoScore: 2,
};

function makeDeps(over: Partial<FinalizeDeps> = {}): FinalizeDeps {
  return {
    apiUrl: 'http://api.test/api',
    getExistingUserId: async () => null,
    getExistingToken: async () => null,
    persistAuth: async () => {},
    clearOnboarding: async () => {},
    navigateToApp: () => {},
    requestPushPermission: async () => true,
    getPushToken: async () => 'ExponentPushToken[xxx]',
    platformOS: 'ios',
    fetchImpl: jest.fn(async (url: string) => {
      if (url.endsWith('/auth/register')) {
        return {
          ok: true,
          status: 201,
          json: async () => ({ success: true, data: { accessToken: 'jwt.tok', user: { id: 'u1', username: 'satoshi' } } }),
        } as any;
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
    expect(toPlatformEnum('web')).toBe('ANDROID');
  });
});

describe('runFinalize', () => {
  it('enregistre via /auth/register puis navigue', async () => {
    const deps = makeDeps();
    await runFinalize(baseState, deps);
    const urls = (deps.fetchImpl as jest.Mock).mock.calls.map((c) => c[0]);
    expect(urls).toContain('http://api.test/api/auth/register');
  });

  it('persiste le token + id renvoyés', async () => {
    const persistAuth = jest.fn(async () => {});
    await runFinalize(baseState, makeDeps({ persistAuth }));
    expect(persistAuth).toHaveBeenCalledWith('jwt.tok', 'u1', 'satoshi');
  });

  it('est idempotent : ne ré-enregistre pas si une session (token) existe déjà', async () => {
    const deps = makeDeps({ getExistingToken: async () => 'existing-token', getExistingUserId: async () => 'existing' });
    await runFinalize(baseState, deps);
    const posts = (deps.fetchImpl as jest.Mock).mock.calls
      .filter((c) => c[0] === 'http://api.test/api/auth/register');
    expect(posts).toHaveLength(0);
  });

  it('enregistre le push token avec platform + header Authorization', async () => {
    const deps = makeDeps();
    await runFinalize({ ...baseState, notificationsEnabled: true }, deps);
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => c[0] === 'http://api.test/api/notifications/register-token');
    expect(call).toBeTruthy();
    expect(JSON.parse(call[1].body)).toMatchObject({ userId: 'u1', token: 'ExponentPushToken[xxx]', platform: 'IOS' });
    expect(call[1].headers.Authorization).toBe('Bearer jwt.tok');
  });

  it('ne plante pas si la permission push est refusée', async () => {
    const deps = makeDeps({ requestPushPermission: async () => false });
    await expect(runFinalize({ ...baseState, notificationsEnabled: true }, deps)).resolves.toBeUndefined();
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => c[0] === 'http://api.test/api/notifications/register-token');
    expect(call).toBeFalsy();
  });

  it('propage une erreur claire en cas de 409', async () => {
    const deps = makeDeps({
      fetchImpl: jest.fn(async () => ({ ok: false, status: 409, json: async () => ({ message: 'taken' }) } as any)),
    });
    await expect(runFinalize(baseState, deps)).rejects.toThrow(/taken|déjà pris/i);
  });

  it('refuse de continuer sans mot de passe (nouveau compte)', async () => {
    const deps = makeDeps();
    await expect(runFinalize({ ...baseState, password: '' }, deps)).rejects.toThrow(/mot de passe/i);
  });

  it('refuse de continuer sans email (nouveau compte)', async () => {
    const deps = makeDeps();
    await expect(runFinalize({ ...baseState, email: null }, deps)).rejects.toThrow(/email/i);
  });

  // ── XP démo (l'onboarding promet demoScore × 10 XP au ResultStep) ─────────

  it("crédite l'XP démo (demoScore × 10) juste après l'inscription", async () => {
    const deps = makeDeps();
    await runFinalize(baseState, deps); // demoScore = 2 → 20 XP
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => c[0] === 'http://api.test/api/users/u1/xp');
    expect(call).toBeTruthy();
    expect(JSON.parse(call[1].body)).toEqual({ amount: 20 });
    expect(call[1].headers.Authorization).toBe('Bearer jwt.tok');
  });

  it("ne crédite pas d'XP quand demoScore = 0", async () => {
    const deps = makeDeps();
    await runFinalize({ ...baseState, demoScore: 0 }, deps);
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => String(c[0]).endsWith('/xp'));
    expect(call).toBeFalsy();
  });

  it("ne re-crédite pas l'XP quand une session existe déjà (retry après échec)", async () => {
    const deps = makeDeps({ getExistingToken: async () => 'existing-token' });
    await runFinalize(baseState, deps);
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => String(c[0]).endsWith('/xp'));
    expect(call).toBeFalsy();
  });

  it("un échec du crédit XP ne bloque pas l'onboarding", async () => {
    const navigateToApp = jest.fn();
    const deps = makeDeps({
      navigateToApp,
      fetchImpl: jest.fn(async (url: string) => {
        if (url.endsWith('/auth/register')) {
          return {
            ok: true,
            status: 201,
            json: async () => ({ success: true, data: { accessToken: 'jwt.tok', user: { id: 'u1', username: 'satoshi' } } }),
          } as any;
        }
        if (url.endsWith('/xp')) throw new Error('network down');
        return { ok: true, status: 200, json: async () => ({ success: true }) } as any;
      }),
    });
    await expect(runFinalize(baseState, deps)).resolves.toBeUndefined();
    expect(navigateToApp).toHaveBeenCalled();
  });
});
