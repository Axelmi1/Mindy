import { Injectable, NotFoundException, GoneException, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { UsersService } from '../users/users.service';
import type { RegisterDto, LoginDto } from '@mindy/shared';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const LINK_BASE = process.env.MAGIC_LINK_BASE_URL ?? 'mindy://auth/verify';
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      username: dto.username,
      email: dto.email.toLowerCase(),
      password: passwordHash,
      preferredDomain: dto.preferredDomain,
      userGoal: dto.userGoal,
      dailyMinutes: dto.dailyMinutes,
      reminderHour: dto.reminderHour,
    });
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    return this.issueToken(user);
  }

  async me(userId: string) {
    return this.users.findById(userId);
  }

  private issueToken<U extends { id: string; username: string }>(user: U) {
    const accessToken = this.jwt.sign({ sub: user.id, username: user.username });
    return { accessToken, user };
  }

  // ── Magic link (unchanged) ────────────────────────────────────────────────
  async sendMagicLink(userId: string, email: string): Promise<void> {
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
