export function getLeague(xp: number): string {
  if (xp < 100) return 'Iron';
  if (xp < 500) return 'Bronze';
  if (xp < 1500) return 'Silver';
  if (xp < 5000) return 'Gold';
  return 'Platinum';
}
