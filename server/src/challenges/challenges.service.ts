import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChallengeStatus } from '@prisma/client';

export interface CreateChallengeDto {
  challengerId: string;
  challengedId: string;
  lessonId: string;
  message?: string;
}

export interface RespondChallengeDto {
  status: 'ACCEPTED' | 'DECLINED';
}

export interface CompleteChallengeDto {
  /** ID of the user who just finished the lesson */
  userId: string;
  /** XP they earned */
  xpEarned: number;
}

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a lesson challenge — challenger invites a friend to beat their lesson score
   */
  async createChallenge(dto: CreateChallengeDto) {
    // Verify users and lesson exist
    const [challenger, challenged, lesson] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.challengerId } }),
      this.prisma.user.findUnique({ where: { id: dto.challengedId } }),
      this.prisma.lesson.findUnique({ where: { id: dto.lessonId } }),
    ]);

    if (!challenger) throw new NotFoundException('Challenger not found');
    if (!challenged) throw new NotFoundException('Challenged user not found');
    if (!lesson)     throw new NotFoundException('Lesson not found');
    if (dto.challengerId === dto.challengedId) {
      throw new BadRequestException('You cannot challenge yourself');
    }

    // Check for existing pending challenge between same users/lesson
    const existing = await this.prisma.lessonChallenge.findFirst({
      where: {
        challengerId: dto.challengerId,
        challengedId: dto.challengedId,
        lessonId:     dto.lessonId,
        status:       'PENDING',
      },
    });
    if (existing) {
      throw new BadRequestException('A pending challenge already exists for this lesson');
    }

    // Challenge expires in 48 hours
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const challenge = await this.prisma.lessonChallenge.create({
      data: {
        challengerId: dto.challengerId,
        challengedId: dto.challengedId,
        lessonId:     dto.lessonId,
        message:      dto.message ?? null,
        expiresAt,
        status:       'PENDING',
      },
      include: {
        challenger: { select: { id: true, username: true } },
        challenged: { select: { id: true, username: true } },
        lesson:     { select: { id: true, title: true, domain: true, xpReward: true } },
      },
    });

    await this.analyticsService.track(dto.challengerId, 'CHALLENGE_SENT', {
      challengeId: challenge.id,
      challengedUsername: challenged.username,
      lessonId: dto.lessonId,
      lessonTitle: lesson.title,
    });

    // Push notification to challenged user (fire-and-forget)
    this.notificationsService
      .sendChallengeReceivedNotification(
        dto.challengedId,
        challenger.username,
        lesson.title,
        challenge.id,
      )
      .catch(() => { /* non-critical */ });

    return challenge;
  }

  /**
   * Get all challenges for a user (sent + received)
   */
  async getChallengesForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Auto-expire overdue challenges
    await this.prisma.lessonChallenge.updateMany({
      where: {
        OR: [{ challengerId: userId }, { challengedId: userId }],
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    const [received, sent] = await Promise.all([
      this.prisma.lessonChallenge.findMany({
        where: { challengedId: userId },
        include: {
          challenger: { select: { id: true, username: true } },
          lesson: { select: { id: true, title: true, domain: true, xpReward: true, difficulty: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.lessonChallenge.findMany({
        where: { challengerId: userId },
        include: {
          challenged: { select: { id: true, username: true } },
          lesson: { select: { id: true, title: true, domain: true, xpReward: true, difficulty: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return { received, sent };
  }

  /**
   * Accept or decline a challenge
   */
  async respondToChallenge(id: string, userId: string, dto: RespondChallengeDto) {
    const challenge = await this.prisma.lessonChallenge.findUnique({
      where: { id },
      include: {
        challenger: { select: { id: true, username: true } },
        lesson:     { select: { id: true, title: true } },
      },
    });

    if (!challenge)                            throw new NotFoundException('Challenge not found');
    if (challenge.challengedId !== userId)     throw new ForbiddenException('Not your challenge');
    if (challenge.status !== 'PENDING')        throw new BadRequestException('Challenge is no longer pending');
    if (challenge.expiresAt < new Date())      throw new BadRequestException('Challenge has expired');

    const updated = await this.prisma.lessonChallenge.update({
      where: { id },
      data: { status: dto.status as ChallengeStatus },
      include: {
        challenger: { select: { id: true, username: true } },
        challenged: { select: { id: true, username: true } },
        lesson:     { select: { id: true, title: true, domain: true, xpReward: true } },
      },
    });

    if (dto.status === 'ACCEPTED') {
      await this.analyticsService.track(userId, 'CHALLENGE_ACCEPTED', {
        challengeId: id,
        challengerUsername: challenge.challenger.username,
        lessonId: challenge.lessonId,
      });

      // Notify the challenger that their challenge was accepted
      const challengedUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      if (challengedUser) {
        this.notificationsService
          .sendChallengeAcceptedNotification(
            challenge.challengerId,
            challengedUser.username,
            challenge.lesson.title,
            id,
          )
          .catch(() => { /* non-critical */ });
      }
    }

    return updated;
  }

  /**
   * Record a participant's completion of a challenge lesson.
   * Called when either the challenger or challenged completes the lesson.
   * When both have finished → determine winner and mark COMPLETED.
   */
  async recordCompletion(id: string, dto: CompleteChallengeDto) {
    const challenge = await this.prisma.lessonChallenge.findUnique({ where: { id } });

    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.status !== 'ACCEPTED') {
      throw new BadRequestException('Challenge must be accepted before recording completion');
    }

    const isChallenger = challenge.challengerId === dto.userId;
    const isChallenged = challenge.challengedId === dto.userId;

    if (!isChallenger && !isChallenged) {
      throw new ForbiddenException('Not a participant in this challenge');
    }

    // Update the XP field for this participant
    const updateData = isChallenger
      ? { challengerXp: dto.xpEarned }
      : { challengedXp: dto.xpEarned };

    let updated = await this.prisma.lessonChallenge.update({
      where: { id },
      data: updateData,
      include: {
        challenger: { select: { id: true, username: true } },
        challenged: { select: { id: true, username: true } },
        lesson:     { select: { id: true, title: true, domain: true, xpReward: true } },
      },
    });

    // If both participants have completed → mark as COMPLETED
    if (updated.challengerXp !== null && updated.challengedXp !== null) {
      updated = await this.prisma.lessonChallenge.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: {
          challenger: { select: { id: true, username: true } },
          challenged: { select: { id: true, username: true } },
          lesson:     { select: { id: true, title: true, domain: true, xpReward: true } },
        },
      });

      const winnerId = (updated.challengerXp ?? 0) >= (updated.challengedXp ?? 0)
        ? challenge.challengerId
        : challenge.challengedId;

      await this.analyticsService.track(winnerId, 'CHALLENGE_COMPLETED', {
        challengeId: id,
        challengerXp: updated.challengerXp,
        challengedXp: updated.challengedXp,
        winnerId,
      });
    }

    return updated;
  }

  /**
   * Get the count of pending received challenges for a user.
   * Used by the mobile app to show notification badges in the UI.
   */
  async getPendingCount(userId: string): Promise<{ pendingCount: number }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Auto-expire stale PENDING challenges first
    await this.prisma.lessonChallenge.updateMany({
      where: {
        challengedId: userId,
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    const pendingCount = await this.prisma.lessonChallenge.count({
      where: { challengedId: userId, status: 'PENDING' },
    });

    return { pendingCount };
  }

  /**
   * Get a single challenge by ID
   */
  async getById(id: string) {
    const challenge = await this.prisma.lessonChallenge.findUnique({
      where: { id },
      include: {
        challenger: { select: { id: true, username: true } },
        challenged: { select: { id: true, username: true } },
        lesson:     { select: { id: true, title: true, domain: true, xpReward: true, difficulty: true } },
      },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  /**
   * Request a rematch on a completed challenge.
   * The requester becomes the new challenger; the opponent becomes the challenged.
   * The same lesson is re-used. A new 48h challenge is created.
   */
  async createRematch(originalChallengeId: string, requesterId: string) {
    // Load the original challenge
    const original = await this.prisma.lessonChallenge.findUnique({
      where: { id: originalChallengeId },
      include: {
        challenger: { select: { id: true, username: true } },
        challenged: { select: { id: true, username: true } },
        lesson:     { select: { id: true, title: true } },
      },
    });

    if (!original) throw new NotFoundException('Challenge not found');
    if (original.status !== 'COMPLETED') {
      throw new BadRequestException('Rematch is only available for COMPLETED challenges');
    }

    // Requester must be a participant
    const isChallenger = original.challengerId === requesterId;
    const isChallenged = original.challengedId === requesterId;
    if (!isChallenger && !isChallenged) {
      throw new ForbiddenException('You are not a participant in this challenge');
    }

    // New challenge: requester becomes challenger, other side becomes challenged
    const newChallengerId = requesterId;
    const newChallengedId = isChallenger ? original.challengedId : original.challengerId;

    // Ensure no existing PENDING rematch between same users/lesson
    const existing = await this.prisma.lessonChallenge.findFirst({
      where: {
        challengerId: newChallengerId,
        challengedId: newChallengedId,
        lessonId:     original.lessonId,
        status:       'PENDING',
      },
    });
    if (existing) {
      throw new BadRequestException('A rematch is already pending for this lesson');
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const rematch = await this.prisma.lessonChallenge.create({
      data: {
        challengerId: newChallengerId,
        challengedId: newChallengedId,
        lessonId:     original.lessonId,
        message:      '🔥 Revanche !',
        expiresAt,
        status:       'PENDING',
      },
      include: {
        challenger: { select: { id: true, username: true } },
        challenged: { select: { id: true, username: true } },
        lesson:     { select: { id: true, title: true, domain: true, xpReward: true } },
      },
    });

    // Notify the opponent
    await this.notificationsService.sendChallengeReceivedNotification(
      newChallengedId,
      original[isChallenger ? 'challenger' : 'challenged']?.username ?? 'Quelqu\'un',
      original.lesson?.title ?? 'une leçon',
      rematch.id,
    );

    await this.analyticsService.track(requesterId, 'CHALLENGE_SENT', {
      challengeId:       rematch.id,
      challengedUsername: rematch.challenged?.username,
      lessonId:          original.lessonId,
      isRematch:         true,
    });

    return rematch;
  }
}
