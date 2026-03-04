-- AlterTable
ALTER TABLE "users" ADD COLUMN     "maxStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "streakFreezeUsedAt" TIMESTAMP(3),
ADD COLUMN     "streakFreezes" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "lessonId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "xpBonusAwarded" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_xp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "weekly_xp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_userId_date_key" ON "daily_challenges"("userId", "date");

-- CreateIndex
CREATE INDEX "weekly_xp_weekStart_xpEarned_idx" ON "weekly_xp"("weekStart", "xpEarned" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_xp_userId_weekStart_key" ON "weekly_xp"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "daily_challenges" ADD CONSTRAINT "daily_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_challenges" ADD CONSTRAINT "daily_challenges_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_xp" ADD CONSTRAINT "weekly_xp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
