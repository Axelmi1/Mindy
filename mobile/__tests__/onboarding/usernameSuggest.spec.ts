import { suggestUsername, isValidUsername } from '../../app/onboarding/lib/usernameSuggest';

describe('usernameSuggest', () => {
  it('génère un pseudo valide (3-20 chars, alphanum + _)', () => {
    const u = suggestUsername(1234);
    expect(isValidUsername(u)).toBe(true);
  });

  it('intègre la base fournie quand elle est propre', () => {
    expect(suggestUsername(42, 'satoshi')).toMatch(/^satoshi_/);
  });

  it('nettoie une base avec caractères interdits', () => {
    expect(isValidUsername(suggestUsername(7, 'João Doe!'))).toBe(true);
  });

  it('isValidUsername rejette trop court / trop long / caractères interdits', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('a'.repeat(21))).toBe(false);
    expect(isValidUsername('bad name')).toBe(false);
    expect(isValidUsername('good_name1')).toBe(true);
  });
});
