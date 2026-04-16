/**
 * League system — maps XP to a league tier
 * Displayed on Profile, Home, and Leaderboard
 */

export interface League {
  name: string;
  emoji: string;
  color: string;
  glowColor: string;
  minXp: number;
  maxXp: number | null; // null = no upper limit
  rank: number; // 0 = lowest
}

const LEAGUES: League[] = [
  { rank: 0, name: 'Iron',     emoji: '⚙️',  color: '#8B949E', glowColor: 'rgba(139,148,158,0.4)', minXp: 0,    maxXp: 99    },
  { rank: 1, name: 'Bronze',   emoji: '🥉',  color: '#CD7F32', glowColor: 'rgba(205,127,50,0.4)',   minXp: 100,  maxXp: 499   },
  { rank: 2, name: 'Silver',   emoji: '🥈',  color: '#C0C0C0', glowColor: 'rgba(192,192,192,0.4)',  minXp: 500,  maxXp: 1999  },
  { rank: 3, name: 'Gold',     emoji: '🥇',  color: '#FFD700', glowColor: 'rgba(255,215,0,0.4)',    minXp: 2000, maxXp: 4999  },
  { rank: 4, name: 'Platinum', emoji: '💠',  color: '#39FF14', glowColor: 'rgba(57,255,20,0.4)',    minXp: 5000, maxXp: null  },
];

/**
 * Get the league for a given XP amount
 */
export function getLeague(xp: number): League {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= LEAGUES[i].minXp) return LEAGUES[i];
  }
  return LEAGUES[0];
}

/**
 * Get progress within current league (0–1)
 */
export function getLeagueProgress(xp: number): number {
  const league = getLeague(xp);
  if (league.maxXp === null) return 1; // Platinum = full
  const range = league.maxXp - league.minXp + 1;
  const earned = xp - league.minXp;
  return Math.min(earned / range, 1);
}

/**
 * XP needed to reach next league
 */
export function xpToNextLeague(xp: number): number {
  const league = getLeague(xp);
  if (league.maxXp === null) return 0;
  return league.maxXp + 1 - xp;
}

export { LEAGUES };
