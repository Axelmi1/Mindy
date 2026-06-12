/**
 * Joueurs de démonstration pour peupler le classement (soutenance).
 * Insérés de façon idempotente par `add-demo-leaderboard.ts`.
 * - `xp` = XP total (badge de ligue + repli classement général)
 * - `weeklyXp` = XP gagné cette semaine (classement hebdomadaire)
 * Ids/referralCode fixes (les codes DEMOxx ne peuvent pas entrer en collision
 * avec les vrais codes : le charset des vrais codes exclut 0 et 1).
 */
export interface DemoCompetitor {
  id: string;
  username: string;
  email: string;
  referralCode: string;
  xp: number;
  level: number;
  streak: number;
  weeklyXp: number;
}

export const DEMO_COMPETITORS: DemoCompetitor[] = [
  { id: 'demo-user-01', username: 'satoshi_lyon',  email: 'demo01@mindy.app', referralCode: 'DEMO01', xp: 8420, level: 14, streak: 47, weeklyXp: 720 },
  { id: 'demo-user-02', username: 'crypto_marie',  email: 'demo02@mindy.app', referralCode: 'DEMO02', xp: 6190, level: 11, streak: 31, weeklyXp: 880 },
  { id: 'demo-user-03', username: 'max_trader',    email: 'demo03@mindy.app', referralCode: 'DEMO03', xp: 5450, level: 10, streak: 12, weeklyXp: 410 },
  { id: 'demo-user-04', username: 'lea_finance',   email: 'demo04@mindy.app', referralCode: 'DEMO04', xp: 4720, level: 9,  streak: 58, weeklyXp: 650 },
  { id: 'demo-user-05', username: 'tom_immo',      email: 'demo05@mindy.app', referralCode: 'DEMO05', xp: 3980, level: 8,  streak: 9,  weeklyXp: 540 },
  { id: 'demo-user-06', username: 'nina_invest',   email: 'demo06@mindy.app', referralCode: 'DEMO06', xp: 3210, level: 7,  streak: 21, weeklyXp: 300 },
  { id: 'demo-user-07', username: 'hugo_bourse',   email: 'demo07@mindy.app', referralCode: 'DEMO07', xp: 2640, level: 6,  streak: 5,  weeklyXp: 470 },
  { id: 'demo-user-08', username: 'emma_btc',      email: 'demo08@mindy.app', referralCode: 'DEMO08', xp: 1890, level: 5,  streak: 14, weeklyXp: 230 },
  { id: 'demo-user-09', username: 'lucas_defi',    email: 'demo09@mindy.app', referralCode: 'DEMO09', xp: 1120, level: 3,  streak: 3,  weeklyXp: 180 },
  { id: 'demo-user-10', username: 'sarah_epargne', email: 'demo10@mindy.app', referralCode: 'DEMO10', xp: 640,  level: 2,  streak: 7,  weeklyXp: 120 },
];
