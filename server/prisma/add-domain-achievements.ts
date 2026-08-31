import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Insère/maj les succès des 3 nouveaux domaines (Immobilier / Impôts / Entrepreneuriat).
 * Idempotent (upsert par key) et NON destructif — même pattern que add-domain-lessons.
 * Lancer une fois contre Neon :  npx ts-node prisma/add-domain-achievements.ts
 *
 * Les libellés sont les canoniques anglais (la DB garde l'anglais, le mobile
 * localise par `key` via ACHIEVEMENTS_FR — voir mobile/src/data/achievementsFr.ts).
 */
const achievements = [
  // LEARNING - Real Estate Domain
  {
    key: 'real_estate_master',
    name: 'Real Estate Mogul',
    description: 'Complete all 10 Real Estate lessons',
    category: 'LEARNING',
    requirementType: 'REAL_ESTATE_LESSONS_COMPLETED',
    requirementValue: 10,
    xpReward: 200,
    rarity: 'RARE',
    orderIndex: 13,
  },
  // LEARNING - Taxes Domain
  {
    key: 'taxes_master',
    name: 'Tax Wizard',
    description: 'Complete all 10 Taxes lessons',
    category: 'LEARNING',
    requirementType: 'TAXES_LESSONS_COMPLETED',
    requirementValue: 10,
    xpReward: 200,
    rarity: 'RARE',
    orderIndex: 14,
  },
  // LEARNING - Entrepreneurship Domain
  {
    key: 'entrepreneurship_master',
    name: 'Founder Mindset',
    description: 'Complete all 10 Entrepreneurship lessons',
    category: 'LEARNING',
    requirementType: 'ENTREPRENEURSHIP_LESSONS_COMPLETED',
    requirementValue: 10,
    xpReward: 200,
    rarity: 'RARE',
    orderIndex: 15,
  },
  // MASTER QUIZ ACHIEVEMENTS (Legendary)
  {
    key: 'real_estate_master_quiz',
    name: '🏆 Real Estate Legend',
    description: 'Pass the Real Estate Master Quiz — prove your mastery',
    category: 'LEARNING',
    requirementType: 'REAL_ESTATE_MASTER_QUIZ_COMPLETED',
    requirementValue: 1,
    xpReward: 500,
    rarity: 'LEGENDARY',
    orderIndex: 53,
  },
  {
    key: 'taxes_master_quiz',
    name: '🏆 Taxes Legend',
    description: 'Pass the Taxes Master Quiz — prove your mastery',
    category: 'LEARNING',
    requirementType: 'TAXES_MASTER_QUIZ_COMPLETED',
    requirementValue: 1,
    xpReward: 500,
    rarity: 'LEGENDARY',
    orderIndex: 54,
  },
  {
    key: 'entrepreneurship_master_quiz',
    name: '🏆 Startup Legend',
    description: 'Pass the Entrepreneurship Master Quiz — prove your mastery',
    category: 'LEARNING',
    requirementType: 'ENTREPRENEURSHIP_MASTER_QUIZ_COMPLETED',
    requirementValue: 1,
    xpReward: 500,
    rarity: 'LEGENDARY',
    orderIndex: 55,
  },
] as const;

async function main() {
  for (const achievement of achievements) {
    const { key, ...data } = achievement;
    await prisma.achievement.upsert({
      where: { key },
      create: { key, ...data },
      update: data,
    });
    console.log(`[add-domain-achievements] upserted ${key}`);
  }
  console.log('[add-domain-achievements] done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
