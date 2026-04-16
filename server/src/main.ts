import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Preserve raw body for Stripe webhook signature verification
    rawBody: true,
  });

  // Enable CORS for mobile app
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // ── Swagger / OpenAPI ────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Mindy API')
    .setDescription(
      'REST API for the Mindy learning platform — Duolingo-style app for Crypto & Finance mastery.',
    )
    .setVersion('1.0.0')
    .addTag('users', 'User management, XP, streaks and settings')
    .addTag('lessons', 'Lesson catalogue and content')
    .addTag('progress', 'User progress tracking and activity heatmap')
    .addTag('daily-challenge', 'Daily challenge scheduling and completion')
    .addTag('leaderboard', 'Weekly XP rankings')
    .addTag('achievements', 'Achievement definitions and user progress')
    .addTag('referrals', 'Referral programme')
    .addTag('analytics', 'Event tracking')
    .addTag('notifications', 'Push notification preferences and tokens')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Mindy API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
  // ────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   [MINDY SERVER] Running on port ${port}          ║
  ║   Swagger docs → http://localhost:${port}/api/docs ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}               ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
}

bootstrap();
