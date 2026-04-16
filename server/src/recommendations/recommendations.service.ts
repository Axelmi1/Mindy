import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Domain, Difficulty } from '@prisma/client';

export interface LessonRecommendation {
  lessonId: string;
  title: string;
  domain: Domain;
  difficulty: Difficulty;
  xpReward: number;
  reason: string;
  priority: number; // 0-100, higher = more recommended
  isNew: boolean;
  isWeak: boolean;
}

export interface PersonalizedPath {
  userId: string;
  dominantDomain: Domain | null;
  weakDomain: Domain | null;
  completionRate: number; // 0-1
  recommendations: LessonRecommendation[];
  nextMilestone: { type: string; current: number; target: number; label: string };
  aiMessage: string;
}

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build a personalized learning path for a user.
   * Analyzes:
   * - Completion rate per domain
   * - Recent activity patterns
   * - XP/level trajectory
   * - Lesson difficulty coverage
   */
  async getPersonalizedPath(userId: string): Promise<PersonalizedPath> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          include: {
            lesson: { select: { id: true, domain: true, difficulty: true, title: true, xpReward: true } },
          },
        },
      },
    });

    if (!user) {
      return this.emptyPath(userId);
    }

    // --- Domain analysis ---
    const domainStats: Record<Domain, { total: number; completed: number }> = {
      CRYPTO: { total: 0, completed: 0 },
      FINANCE: { total: 0, completed: 0 },
      TRADING: { total: 0, completed: 0 },
    };

    const completedLessonIds = new Set<string>();

    for (const p of user.progress) {
      const d = p.lesson.domain;
      domainStats[d].total++;
      if (p.isCompleted) {
        domainStats[d].completed++;
        completedLessonIds.add(p.lessonId);
      }
    }

    // All lessons
    const allLessons = await this.prisma.lesson.findMany({
      select: { id: true, title: true, domain: true, difficulty: true, xpReward: true, orderIndex: true },
      orderBy: { orderIndex: 'asc' },
    });

    // Fill domainStats totals with actual lesson counts
    for (const l of allLessons) {
      if (!completedLessonIds.has(l.id)) {
        // lesson not in progress at all — still counts
      }
    }

    // Count by domain
    const domainTotals: Record<Domain, number> = { CRYPTO: 0, FINANCE: 0, TRADING: 0 };
    for (const l of allLessons) {
      domainTotals[l.domain]++;
    }

    const completedByDomain: Record<Domain, number> = { CRYPTO: 0, FINANCE: 0, TRADING: 0 };
    for (const p of user.progress) {
      if (p.isCompleted) completedByDomain[p.lesson.domain]++;
    }

    const totalLessons = allLessons.length;
    const totalCompleted = completedLessonIds.size;
    const completionRate = totalLessons > 0 ? totalCompleted / totalLessons : 0;

    // Dominant domain (most completed)
    const dominantDomain = (Object.keys(completedByDomain) as Domain[]).reduce(
      (best, d) => (completedByDomain[d] > completedByDomain[best] ? d : best),
      'CRYPTO' as Domain,
    );

    // Weak domain (lowest completion % vs total available)
    const weakDomain = (Object.keys(domainTotals) as Domain[]).reduce(
      (worst, d) => {
        const rate = domainTotals[d] > 0 ? completedByDomain[d] / domainTotals[d] : 0;
        const worstRate = domainTotals[worst] > 0 ? completedByDomain[worst] / domainTotals[worst] : 0;
        return rate < worstRate ? d : worst;
      },
      'FINANCE' as Domain,
    );

    // --- Build recommendations ---
    const incomplete = allLessons.filter((l) => !completedLessonIds.has(l.id));
    const recommendations: LessonRecommendation[] = [];

    for (const lesson of incomplete.slice(0, 20)) {
      let priority = 50;
      let reason = 'Continue your learning journey';
      let isWeak = false;

      // Boost weak domain
      if (lesson.domain === weakDomain) {
        priority += 25;
        reason = `Strengthen your ${lesson.domain.toLowerCase()} knowledge`;
        isWeak = true;
      }

      // Boost preferred domain (user.preferredDomain)
      if (user.preferredDomain && lesson.domain === user.preferredDomain) {
        priority += 15;
        reason = `Matches your focus: ${lesson.domain.toLowerCase()}`;
      }

      // Difficulty ladder — prefer next difficulty
      const userLevel = user.level;
      if (userLevel < 5 && lesson.difficulty === 'BEGINNER') priority += 20;
      else if (userLevel >= 5 && userLevel < 15 && lesson.difficulty === 'INTERMEDIATE') priority += 20;
      else if (userLevel >= 15 && lesson.difficulty === 'ADVANCED') priority += 20;

      // In-progress (started but not completed) — always boost
      const inProgress = user.progress.find((p) => p.lessonId === lesson.id && !p.isCompleted);
      if (inProgress && inProgress.completedSteps.length > 0) {
        priority = Math.min(100, priority + 30);
        reason = 'Resume where you left off';
        isWeak = false;
      }

      recommendations.push({
        lessonId: lesson.id,
        title: lesson.title,
        domain: lesson.domain,
        difficulty: lesson.difficulty,
        xpReward: lesson.xpReward,
        reason,
        priority: Math.min(100, priority),
        isNew: !inProgress,
        isWeak,
      });
    }

    // Sort by priority descending, take top 6
    recommendations.sort((a, b) => b.priority - a.priority);
    const top6 = recommendations.slice(0, 6);

    // --- Next milestone ---
    const nextMilestone = this.computeNextMilestone(user.xp, user.streak, totalCompleted);

    // --- AI message ---
    const aiMessage = this.buildAiMessage(
      user.username,
      dominantDomain,
      weakDomain,
      completionRate,
      user.streak,
    );

    return {
      userId,
      dominantDomain,
      weakDomain,
      completionRate,
      recommendations: top6,
      nextMilestone,
      aiMessage,
    };
  }

  private computeNextMilestone(
    xp: number,
    streak: number,
    lessonsCompleted: number,
  ): { type: string; current: number; target: number; label: string } {
    const xpMilestones = [100, 250, 500, 1000, 2500, 5000, 10000];
    const nextXp = xpMilestones.find((m) => m > xp);
    if (nextXp) {
      return { type: 'xp', current: xp, target: nextXp, label: `Reach ${nextXp} XP` };
    }

    const streakMilestones = [3, 7, 14, 30, 60, 100];
    const nextStreak = streakMilestones.find((m) => m > streak);
    if (nextStreak) {
      return { type: 'streak', current: streak, target: nextStreak, label: `${nextStreak}-day streak` };
    }

    const lessonMilestones = [5, 10, 20, 30, 50, 70];
    const nextLesson = lessonMilestones.find((m) => m > lessonsCompleted);
    if (nextLesson) {
      return { type: 'lessons', current: lessonsCompleted, target: nextLesson, label: `Complete ${nextLesson} lessons` };
    }

    return { type: 'xp', current: xp, target: xp + 500, label: 'Keep earning XP!' };
  }

  private buildAiMessage(
    username: string,
    dominant: Domain,
    weak: Domain,
    rate: number,
    streak: number,
  ): string {
    const pct = Math.round(rate * 100);

    if (pct === 0) {
      return `Hey ${username}! 🚀 Ready to start? Let's build your financial IQ from scratch.`;
    }
    if (pct < 20) {
      const domainLabel = dominant.charAt(0) + dominant.slice(1).toLowerCase();
      return `Nice start ${username}! You're ${pct}% through. Your ${domainLabel} knowledge is growing — let's target ${weak.toLowerCase()} next to round out your skills.`;
    }
    if (pct < 50) {
      return `You're ${pct}% done, ${username}! ${streak > 7 ? `That ${streak}-day streak is 🔥` : 'Build your streak for bonus XP'}. Focus: ${weak.toLowerCase()} needs love.`;
    }
    if (pct < 80) {
      return `Halfway there ${username} (${pct}%)! You're ahead of 90% of users. Time to push hard on ${weak.toLowerCase()} to unlock elite status.`;
    }
    return `Incredible ${username}! ${pct}% complete — you're basically a DeFi professor. Just ${weak.toLowerCase()} left to master.`;
  }

  private emptyPath(userId: string): PersonalizedPath {
    return {
      userId,
      dominantDomain: null,
      weakDomain: null,
      completionRate: 0,
      recommendations: [],
      nextMilestone: { type: 'xp', current: 0, target: 100, label: 'Reach 100 XP' },
      aiMessage: "Let's start your journey! 🚀",
    };
  }
}
