import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // =========================
  // ✅ ADMIN FROM ENV
  // =========================

  const adminEmail = process.env.MAILADMIN;
  const adminPassword = process.env.MAILADMINPASSWORD;
  const adminFirstName = process.env.MAILADMINNAME || 'Admin';
  const adminLastName = process.env.MAILLASTNAME || 'Admin';
  const adminPhone = process.env.MAILADMINPHONE || '';

  if (!adminEmail || !adminPassword) {
    throw new Error(
      '❌ MAILADMIN ou MAILADMINPASSWORD manquant dans le fichier .env',
    );
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      phone: adminPhone,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log('✅ Admin user ready:', adminUser.email);

  // =========================
  // ✅ CATEGORIES
  // =========================

  const categories = [
    {
      name: 'Boissons gazeuses',
      description: 'Sodas et boissons gazeuses',
    },
    {
      name: 'Wisky',
      description: 'Boissons alcoolisées type whisky',
    },
    {
      name: 'Vin',
      description: 'Vins blancs et rouges',
    },
    {
      name: 'Bières',
      description: 'Bières locales et importées',
    },
    {
      name: 'Eaux',
      description: 'Eaux minérales et de source',
    },
    {
      name: 'Jus',
      description: 'Jus de fruits',
    },
    {
      name: 'Boissons energetiques',
      description: 'Boissons energetiques',
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
    });

    console.log(`✅ Category ready: ${category.name}`);
  }

  // =========================
  // ✅ BRANDS
  // =========================

  const brands = [
    {
      name: 'BRAILICO',
      description: 'The BRAILICO Company',
    },
    {
      name: 'BRASCO',
      description: 'Brasseries BRASCO',
    },
    {
      name: 'EAU MAYO',
      description: 'Eaux minérales',
    },
    {
      name: 'GO-FRESH',
      description: 'Eaux minérales',
    },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { name: brand.name },
      update: {},
      create: {
        name: brand.name,
        description: brand.description,
        isActive: true,
      },
    });

    console.log(`✅ Brand ready: ${brand.name}`);
  }

  // =========================
  // ✅ DEFAULT CLIENT
  // =========================

 /*  const client = await prisma.client.upsert({
    where: { email: 'jean.kouassi@example.com' },
    update: {},
    create: {
      firstName: 'Jean',
      lastName: 'Kouassi',
      phone: '+22505555555',
      email: 'jean.kouassi@example.com',
      address: 'Client par défaut',
      isActive: true,
    },
  });

  console.log('✅ Client ready:', client.email); */

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
