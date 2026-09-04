import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Crée/maj le compte de démonstration utilisé par le bouton « Admin » du login.
 * Idempotent (upsert par email) et NON destructif — même pattern que
 * add-domain-lessons / add-domain-achievements.
 *
 * Le mot de passe suit ADMIN_PASSWORD (défaut `MindyDemo2026`), qui doit rester
 * aligné avec EXPO_PUBLIC_ADMIN_PASSWORD côté mobile.
 *
 * Lancer une fois contre Neon :  npx ts-node prisma/add-admin-user.ts
 */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'demo@mindy.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'MindyDemo2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'mindy_demo';

async function main() {
  const password = bcrypt.hashSync(ADMIN_PASSWORD, 12);

  // Le pseudo est unique : s'il est déjà pris par un AUTRE compte, on le suffixe.
  let username = ADMIN_USERNAME;
  const clash = await prisma.user.findUnique({ where: { username } });
  if (clash && clash.email !== ADMIN_EMAIL) {
    username = `${ADMIN_USERNAME}_${Date.now().toString().slice(-4)}`;
    console.log(`[add-admin-user] pseudo déjà pris → utilisation de ${username}`);
  }

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    // On ne réinitialise que le mot de passe : XP, série et progression du
    // compte de démo sont conservés entre deux déploiements.
    update: { password, deletedAt: null },
    create: {
      email: ADMIN_EMAIL,
      username,
      password,
      referralCode: 'TEST01',
      xp: 0,
      level: 1,
      streak: 0,
    },
  });

  console.log(`[add-admin-user] compte prêt : ${user.email} (${user.username})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
