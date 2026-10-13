import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  // Base64 expands a 5 MB image; allow room for the encoded JSON payload.
  app.useBodyParser('json', { limit: '8mb' });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4200'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('MyBusi API')
    .setDescription('API de gestion commerciale multi-boutiques')
    .setVersion('1.0')
    .addTag('Authentication', 'Endpoints pour l\'authentification et l\'autorisation')
    .addTag('Depots', 'Gestion des dépôts')
    .addTag('Products', 'Gestion des produits')
    .addTag('Categories', 'Gestion des catégories de produits')
    .addTag('Brands', 'Gestion des marques')
    .addTag('Stock', 'Gestion des stocks')
    .addTag('Sales', 'Gestion des ventes')
    .addTag('Payments', 'Gestion des paiements')
    .addTag('Clients', 'Gestion des clients')
    .addTag('Suppliers', 'Gestion des fournisseurs')
    .addTag('Purchases', 'Gestion des achats')
    .addTag('Finance', 'Rapports financiers et tableaux de bord')
    .addTag('Expenses', 'Gestion des dépenses')
    .addTag('Salaries', 'Gestion des salaires')
    .addTag('Logs', 'Journal d\'activités et audit')
    .addTag('Invoices', 'Génération de factures PDF')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'MyBusi API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  
  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`🔗 API base URL: http://localhost:${port}/api/v1\n`);
}

bootstrap();
