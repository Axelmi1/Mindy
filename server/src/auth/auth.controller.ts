import { BadRequestException, Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { mapUserToResponse } from '../users/user.mapper';

interface AuthRequest {
  user: { userId: string; username: string };
}

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  preferredDomain: z.enum(['CRYPTO', 'FINANCE', 'BOTH']).optional(),
  userGoal: z.string().optional(),
  dailyMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]).optional(),
  reminderHour: z.number().int().min(0).max(23).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const MagicLinkSchema = z.object({
  userId: z.string().cuid(),
  email: z.string().email(),
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ strict: { limit: 20, ttl: 60_000 } })
  async register(@Body() body: unknown) {
    const dto = this.parse(RegisterSchema, body);
    const { accessToken, user } = await this.auth.register(dto);
    return { success: true, data: { accessToken, user: mapUserToResponse(user) } };
  }

  @Public()
  @Post('login')
  @Throttle({ strict: { limit: 20, ttl: 60_000 } })
  async login(@Body() body: unknown) {
    const dto = this.parse(LoginSchema, body);
    const { accessToken, user } = await this.auth.login(dto);
    return { success: true, data: { accessToken, user: mapUserToResponse(user) } };
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@Req() req: AuthRequest) {
    const user = await this.auth.me(req.user.userId);
    return { success: true, data: mapUserToResponse(user) };
  }

  @Public()
  @Post('magic-link')
  @Throttle({ strict: { limit: 20, ttl: 60_000 } })
  async sendMagicLink(@Body() body: unknown) {
    const parsed = this.parse(MagicLinkSchema, body);
    try {
      await this.auth.sendMagicLink(parsed.userId, parsed.email);
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  @Public()
  @Get('verify/:token')
  async verify(@Param('token') token: string) {
    const user = await this.auth.verify(token);
    return { success: true, data: mapUserToResponse(user) };
  }

  private parse<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0]?.message ?? 'Données invalides');
    }
    return result.data;
  }
}
