import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for mobile app
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   [MINDY SERVER] Running on port ${port}          ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}               ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
}

bootstrap();

