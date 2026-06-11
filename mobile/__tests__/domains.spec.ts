import { DOMAINS, DOMAIN_ORDER } from '../src/data/domains';

const EXPECTED = ['CRYPTO', 'FINANCE', 'TRADING', 'REAL_ESTATE', 'ENTREPRENEURSHIP', 'TAXES'];

describe('domains config', () => {
  it('DOMAINS couvre exactement les 6 domaines', () => {
    expect(Object.keys(DOMAINS).sort()).toEqual([...EXPECTED].sort());
  });

  it('DOMAIN_ORDER liste les 6 domaines', () => {
    expect([...DOMAIN_ORDER].sort()).toEqual([...EXPECTED].sort());
  });

  it('chaque domaine a label / couleur hex / icône', () => {
    for (const d of DOMAIN_ORDER) {
      expect(DOMAINS[d].label).toBeTruthy();
      expect(DOMAINS[d].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(DOMAINS[d].icon).toBeTruthy();
    }
  });
});
