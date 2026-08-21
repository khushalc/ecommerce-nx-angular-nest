import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Storefront (SSR) and Admin (CSR SPA) origins.
  app.enableCors({
    origin: [
      process.env.STOREFRONT_PUBLIC_URL ?? 'http://localhost:4200',
      `http://localhost:${process.env.ADMIN_PORT ?? 4300}`,
    ],
    credentials: true,
  });

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
  Logger.log(`🚀 API running on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
