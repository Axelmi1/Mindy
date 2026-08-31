import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

/** Définition statique des quêtes du jour (mêmes pour tous, remises à zéro chaque nuit). */
export const DAILY_QUESTS = [
  { key: 'lessons_2', title: 'Termine 2 leçons', emoji: '📚', target: 2, xpReward: 30 },
  { key: 'xp_50', title: 'Gagne 50 XP', emoji: '⚡', target: 50, xpReward: 25 },
  { key: 'daily_challenge', title: 'Réussis le défi du jour', emoji: '🎯', target: 1, xpReward: 20 },
] as const;

export type QuestKey = (typeof DAILY_QUESTS)[number]['key'];

export interface DailyQuestStatus {
  key: QuestKey;
  title: string;
  emoji: string;
  target: number;
  xpReward: number;
  progress: number;
  isCompleted: boolean;
  claimed: boolean;
}

@Injectable()
export class QuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  /** Les quêtes du jour avec progression, complétion et état de réclamation. */
  async getTodayQuests(userId: string): Promise<DailyQuestStatus[]> {
    const startOfDay = this.getStartOfDay();
    const today = this.getDateOnly(new Date());

    const [lessonEvents, xpEvents, challenge, claims] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { userId, eventType: 'LESSON_COMPLETED', timestamp: { gte: startOfDay } },
      }),
      this.prisma.analyticsEvent.findMany({
        where: { userId, eventType: 'XP_EARNED', timestamp: { gte: startOfDay } },
        select: { eventData: true },
      }),
      this.prisma.dailyChallenge.findUnique({
        where: { userId_date: { userId, date: today } },
        select: { isCompleted: true },
      }),
      this.prisma.dailyQuestClaim.findMany({
        where: { userId, date: today },
        select: { questKey: true },
      }),
    ]);

    const xpToday = xpEvents.reduce((sum, e) => {
      const amount = (e.eventData as { amount?: number } | null)?.amount;
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);

    const claimedKeys = new Set(claims.map((c) => c.questKey));

    const progressByKey: Record<QuestKey, number> = {
      lessons_2: lessonEvents,
      xp_50: xpToday,
      daily_challenge: challenge?.isCompleted ? 1 : 0,
    };

    return DAILY_QUESTS.map((quest) => {
      const progress = Math.min(progressByKey[quest.key], quest.target);
      return {
        ...quest,
        progress,
        isCompleted: progress >= quest.target,
        claimed: claimedKeys.has(quest.key),
      };
    });
  }

  /** Réclame la récompense d'une quête complétée (une seule fois par jour). */
  async claim(userId: string, questKey: string) {
    const quests = await this.getTodayQuests(userId);
    const quest = quests.find((q) => q.key === questKey);

    if (!quest) {
      throw new NotFoundException(`Unknown quest: ${questKey}`);
    }
    if (!quest.isCompleted) {
      throw new BadRequestException('Quest is not completed yet');
    }
    if (quest.claimed) {
      throw new ConflictException('Quest reward already claimed today');
    }

    try {
      await this.prisma.dailyQuestClaim.create({
        data: { userId, questKey: quest.key, date: this.getDateOnly(new Date()) },
      });
    } catch (error: unknown) {
      // Contrainte unique [userId, date, questKey] → double-clic / requêtes parallèles
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException('Quest reward already claimed today');
      }
      throw error;
    }

    const user = await this.usersService.addXp(userId, quest.xpReward);

    return {
      quest: { ...quest, claimed: true },
      xpAwarded: quest.xpReward,
      totalXp: user.xp,
      level: user.level,
    };
  }

  /** Minuit local — même convention que DailyChallengeService. */
  private getStartOfDay(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private getDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
