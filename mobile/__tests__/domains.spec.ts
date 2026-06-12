import { DOMAINS, DOMAIN_ORDER, domainColor, domainLabel, domainEmoji } from '../src/data/domains';

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

  it('helpers : domaine connu', () => {
    expect(domainColor('REAL_ESTATE')).toBe('#A371F7');
    expect(domainLabel('TAXES')).toBe('Impôts');
    expect(domainEmoji('ENTREPRENEURSHIP')).toBe('🚀');
  });
  it('helpers : domaine inconnu → fallback', () => {
    expect(domainColor('NOPE')).toBe('#8B949E');
    expect(domainLabel('NOPE')).toBe('NOPE');
    expect(domainEmoji('NOPE')).toBe('•');
  });
});
