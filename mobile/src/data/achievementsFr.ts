/**
 * Traductions françaises des succès (achievements).
 *
 * La base de données stocke une `key` stable (ex. "first_lesson") + des libellés
 * canoniques en anglais. On localise l'affichage côté client par `key` — c'est le
 * pattern i18n classique : la DB garde l'identifiant, le front gère la langue.
 *
 * Toute key absente de cette table retombe sur le libellé d'origine (fallback).
 */
export const ACHIEVEMENTS_FR: Record<string, { name: string; description: string }> = {
  // LEARNING — leçons terminées
  first_lesson: { name: 'Premier pas', description: 'Termine ta première leçon' },
  lessons_5: { name: 'Sur les rails', description: 'Termine 5 leçons' },
  lessons_10: { name: 'Curieux de savoir', description: 'Termine 10 leçons' },
  lessons_25: { name: 'Élève appliqué', description: 'Termine 25 leçons' },
  lessons_50: { name: 'Érudit', description: 'Termine 50 leçons' },

  // LEARNING — domaines complétés
  crypto_master: { name: 'Maître de la crypto', description: 'Termine les 10 leçons Crypto' },
  finance_guru: { name: 'Gourou de la finance', description: 'Termine les 9 leçons Finance' },
  trading_pro: { name: 'Pro du trading', description: 'Termine les 10 leçons Trading' },
  real_estate_master: { name: "Magnat de l'immobilier", description: 'Termine les 10 leçons Immobilier' },
  taxes_master: { name: 'Sorcier des impôts', description: 'Termine les 10 leçons Impôts' },
  entrepreneurship_master: { name: 'Esprit de fondateur', description: 'Termine les 10 leçons Entrepreneuriat' },

  // LEARNING — quiz finaux (légendaires)
  crypto_master_quiz: { name: '🏆 Légende crypto', description: 'Réussis le Quiz final Crypto — prouve ta maîtrise' },
  finance_master_quiz: { name: '🏆 Légende finance', description: 'Réussis le Quiz final Finance — prouve ta maîtrise' },
  trading_master_quiz: { name: '🏆 Légende trading', description: 'Réussis le Quiz final Trading — prouve ta maîtrise' },
  real_estate_master_quiz: { name: '🏆 Légende immobilier', description: "Réussis le Quiz final Immobilier — prouve ta maîtrise" },
  taxes_master_quiz: { name: '🏆 Légende impôts', description: 'Réussis le Quiz final Impôts — prouve ta maîtrise' },
  entrepreneurship_master_quiz: { name: '🏆 Légende startup', description: 'Réussis le Quiz final Entrepreneuriat — prouve ta maîtrise' },

  // LEARNING — défis du jour
  first_challenge: { name: 'Défi accepté', description: 'Termine ton premier défi du jour' },
  challenges_7: { name: 'Guerrier de la semaine', description: 'Termine 7 défis du jour' },
  challenges_30: { name: 'Champion des défis', description: 'Termine 30 défis du jour' },

  // STREAK — séries
  streak_3: { name: 'En feu', description: 'Atteins une série de 3 jours' },
  streak_7: { name: 'Une semaine au top', description: 'Atteins une série de 7 jours' },
  streak_14: { name: 'Deux semaines de feu', description: 'Atteins une série de 14 jours' },
  streak_30: { name: 'Maître du mois', description: 'Atteins une série de 30 jours' },
  streak_60: { name: 'Mains de diamant', description: 'Atteins une série de 60 jours' },
  streak_100: { name: 'Centurion', description: 'Atteins une série de 100 jours' },
  streak_365: { name: 'Légende', description: 'Atteins une série de 365 jours' },

  // XP — XP gagnés
  xp_100: { name: "Collectionneur d'XP", description: 'Gagne 100 XP' },
  xp_500: { name: "Amasseur d'XP", description: 'Gagne 500 XP' },
  xp_1000: { name: "Maître de l'XP", description: 'Gagne 1 000 XP' },
  xp_5000: { name: 'Millionnaire en XP', description: 'Gagne 5 000 XP' },
  xp_10000: { name: 'Milliardaire en XP', description: 'Gagne 10 000 XP' },

  // XP — niveaux atteints
  level_5: { name: 'Étoile montante', description: 'Atteins le niveau 5' },
  level_10: { name: 'Vétéran', description: 'Atteins le niveau 10' },
  level_20: { name: 'Élite', description: 'Atteins le niveau 20' },
  level_50: { name: 'Grand maître', description: 'Atteins le niveau 50' },

  // SOCIAL — parrainages
  referral_1: { name: 'Recruteur', description: 'Parraine 1 ami' },
  referral_3: { name: 'Ambassadeur', description: 'Parraine 3 amis' },
  referral_5: { name: 'Influenceur', description: 'Parraine 5 amis' },
  referral_10: { name: 'Bâtisseur de communauté', description: 'Parraine 10 amis' },
  referral_25: { name: 'Légende du réseau', description: 'Parraine 25 amis' },
};

/** Forme « à plat » : le succès porte directement key/name/description (Achievement, LockedAchievement). */
type FlatAchievement = { key: string; name: string; description: string };
/** Forme imbriquée : le succès débloqué porte un sous-objet `achievement` (UserAchievement). */
type NestedAchievement = { achievement: FlatAchievement };

/** Localise une liste de succès « à plat » (Achievement / LockedAchievement). */
export function localizeFlat<T extends FlatAchievement>(list: T[]): T[] {
  return list.map((a) => {
    const fr = ACHIEVEMENTS_FR[a.key];
    return fr ? ({ ...a, name: fr.name, description: fr.description } as T) : a;
  });
}

/** Localise une liste de succès débloqués (UserAchievement, libellés sous `.achievement`). */
export function localizeNested<T extends NestedAchievement>(list: T[]): T[] {
  return list.map((a) => {
    const fr = ACHIEVEMENTS_FR[a.achievement.key];
    return fr
      ? ({ ...a, achievement: { ...a.achievement, name: fr.name, description: fr.description } } as T)
      : a;
  });
}
