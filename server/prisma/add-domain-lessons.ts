import { PrismaClient, Prisma } from '@prisma/client';
import { DEMO_DOMAIN_LESSONS } from '../src/lessons/demo-domain-lessons.data';

const prisma = new PrismaClient();

/**
 * Insère/maj les 3 leçons démo des nouveaux domaines.
 * Idempotent (upsert par id fixe) et NON destructif (aucun deleteMany).
 * Lancer une fois contre Neon :  npx ts-node prisma/add-domain-lessons.ts
 */
async function main() {
  for (const lesson of DEMO_DOMAIN_LESSONS) {
    const { id, content, ...meta } = lesson;
    const data = { ...meta, content: content as unknown as Prisma.InputJsonValue };
    await prisma.lesson.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
    console.log(`[add-domain-lessons] upserted ${id} (${meta.domain})`);
  }
  console.log('[add-domain-lessons] done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
