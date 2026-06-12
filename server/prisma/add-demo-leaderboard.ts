import { PrismaClient } from '@prisma/client';
import { DEMO_COMPETITORS } from './demo-leaderboard.data';

const prisma = new PrismaClient();

/**
 * Insère/maj les joueurs de démo + leur XP de la semaine courante.
 * Idempotent (upsert par id) et NON destructif (aucun deleteMany).
 * Lancer une fois (ou à chaque déploiement) :  npx ts-node prisma/add-demo-leaderboard.ts
 */
function getWeekStart(date: Date): Date {
  // Dimanche de la semaine courante, en UTC — identique à LeaderboardService.getWeekStart.
  const day = date.getUTCDay();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day));
}

async function main() {
  const weekStart = getWeekStart(new Date());

  for (const c of DEMO_COMPETITORS) {
    await prisma.user.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        username: c.username,
        email: c.email,
        referralCode: c.referralCode,
        xp: c.xp,
        level: c.level,
        streak: c.streak,
        maxStreak: c.streak,
      },
      update: {
        username: c.username,
        email: c.email,
        xp: c.xp,
        level: c.level,
        streak: c.streak,
        maxStreak: c.streak,
      },
    });

    await prisma.weeklyXp.upsert({
      where: { userId_weekStart: { userId: c.id, weekStart } },
      create: { userId: c.id, weekStart, xpEarned: c.weeklyXp },
      update: { xpEarned: c.weeklyXp },
    });

    console.log(`[demo-leaderboard] upserted ${c.username} (xp total ${c.xp}, semaine ${c.weeklyXp})`);
  }

  console.log('[demo-leaderboard] done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
