import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix global API
  app.setGlobalPrefix('api/v1');

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS (compatible production + Railway)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Configuration Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MyDepot API')
    .setDescription('API complète pour la gestion de dépôt de boisson')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'MyDepot API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // Port Railway (obligatoire)
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Écoute réseau complète (important pour Railway)
  await app.listen(port, '0.0.0.0');

  console.log(`
🚀 Server running on port ${port}
📚 Swagger: /api/docs
🔗 API Base: /api/v1
  `);
}

bootstrap();
