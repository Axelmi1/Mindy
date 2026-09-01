import { DOMAINS, DOMAIN_ORDER, LEARN_DOMAIN_ORDER, domainColor, domainLabel, domainEmoji } from '../src/data/domains';

const EXPECTED = ['CRYPTO', 'FINANCE', 'TRADING', 'REAL_ESTATE', 'ENTREPRENEURSHIP', 'TAXES'];

describe('domains config', () => {
  it('DOMAINS couvre les 6 domaines + la section DEMO', () => {
    expect(Object.keys(DOMAINS).sort()).toEqual([...EXPECTED, 'DEMO'].sort());
  });

  it('DOMAIN_ORDER liste les 6 domaines (sans DEMO — onboarding/réglages)', () => {
    expect([...DOMAIN_ORDER].sort()).toEqual([...EXPECTED].sort());
    expect(DOMAIN_ORDER).not.toContain('DEMO');
  });

  it('LEARN_DOMAIN_ORDER ajoute DEMO en dernier onglet du catalogue', () => {
    expect(LEARN_DOMAIN_ORDER).toHaveLength(7);
    expect(LEARN_DOMAIN_ORDER[LEARN_DOMAIN_ORDER.length - 1]).toBe('DEMO');
  });

  it('chaque domaine a label / couleur hex / icône', () => {
    for (const d of LEARN_DOMAIN_ORDER) {
      expect(DOMAINS[d].label).toBeTruthy();
      expect(DOMAINS[d].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(DOMAINS[d].icon).toBeTruthy();
    }
  });

  it('helpers : domaine connu', () => {
    expect(domainColor('REAL_ESTATE')).toBe('#A371F7');
    expect(domainLabel('TAXES')).toBe('Impôts');
    expect(domainEmoji('ENTREPRENEURSHIP')).toBe('🚀');
    expect(domainLabel('DEMO')).toBe('Démo');
  });
  it('helpers : domaine inconnu → fallback', () => {
    expect(domainColor('NOPE')).toBe('#8B949E');
    expect(domainLabel('NOPE')).toBe('NOPE');
    expect(domainEmoji('NOPE')).toBe('•');
  });
});
