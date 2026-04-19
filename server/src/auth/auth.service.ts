import { Injectable, NotFoundException, GoneException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const LINK_BASE = process.env.MAGIC_LINK_BASE_URL ?? 'mindy://auth/verify';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async sendMagicLink(userId: string, email: string): Promise<void> {
    // Invalidate any active token for this (userId, email) pair
    await this.prisma.magicLinkToken.updateMany({
      where: { userId, email, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await this.prisma.magicLinkToken.create({ data: { userId, email, token, expiresAt } });

    const link = `${LINK_BASE}/${token}`;
    await this.email.sendMagicLink(email, link);
  }

  async verify(token: string) {
    const record = await this.prisma.magicLinkToken.findUnique({ where: { token } });
    if (!record) throw new NotFoundException('Invalid token');
    if (record.usedAt) throw new GoneException('Token already used');
    if (record.expiresAt < new Date()) throw new GoneException('Token expired');

    const [, user] = await this.prisma.$transaction([
      this.prisma.magicLinkToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { email: record.email, emailVerified: true },
      }),
    ]);
    return user;
  }
}
