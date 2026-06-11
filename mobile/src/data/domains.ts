import type { Domain } from '@mindy/shared';

export interface DomainMeta {
  label: string;
  sublabel: string;
  color: string;
  icon: string;
}

/** Source de vérité unique pour l'affichage des domaines (label, couleur, icône). */
export const DOMAINS: Record<Domain, DomainMeta> = {
  CRYPTO:           { label: 'Crypto',          sublabel: 'Bitcoin, blockchain, DeFi',  color: '#F7931A', icon: '₿' },
  FINANCE:          { label: 'Finance',         sublabel: 'Investir, budget, bourse',    color: '#3FB950', icon: '💰' },
  TRADING:          { label: 'Trading',         sublabel: 'Marchés, bougies, risque',    color: '#58A6FF', icon: '📊' },
  REAL_ESTATE:      { label: 'Immobilier',      sublabel: 'Acheter, louer, investir',    color: '#A371F7', icon: '🏠' },
  ENTREPRENEURSHIP: { label: 'Entrepreneuriat', sublabel: 'Lancer & gérer un business',  color: '#FF7B72', icon: '🚀' },
  TAXES:            { label: 'Impôts',           sublabel: 'Fiscalité, déclarations',     color: '#E3B341', icon: '🧾' },
};

/** Ordre d'affichage des domaines dans l'onboarding et le catalogue. */
export const DOMAIN_ORDER: Domain[] = ['CRYPTO', 'FINANCE', 'TRADING', 'REAL_ESTATE', 'ENTREPRENEURSHIP', 'TAXES'];
