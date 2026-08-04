import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const allowedOrigins = [
    process.env.WEB_URL     ?? 'http://localhost:3001',
    process.env.PORTAL_URL  ?? 'http://localhost:3002',
    process.env.PARTNER_URL ?? 'http://localhost:3003',
    process.env.ADMIN_URL   ?? 'http://localhost:3004',
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('MJN Healthcare API')
    .setDescription('MJN Healthcare Academy and Professional Services API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`MJN Healthcare API running on port ${port}`);
}

bootstrap();
