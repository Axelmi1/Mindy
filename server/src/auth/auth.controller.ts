import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthService } from './auth.service';

const MagicLinkSchema = z.object({
  userId: z.string().cuid(),
  email: z.string().email(),
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('magic-link')
  @Throttle({ strict: { limit: 20, ttl: 60_000 } })
  async sendMagicLink(@Body() body: unknown) {
    const parsed = MagicLinkSchema.parse(body);
    try {
      await this.auth.sendMagicLink(parsed.userId, parsed.email);
      return { success: true };
    } catch {
      // Don't leak whether the user exists — always return a neutral response
      return { success: true };
    }
  }

  @Get('verify/:token')
  async verify(@Param('token') token: string) {
    const user = await this.auth.verify(token);
    return { success: true, data: user };
  }
}
