import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mydepot.com' },
    update: {},
    create: {
      email: 'admin@mydepot.com',
      phone: '+22670000001',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'MyDepot',
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  const depot1 = await prisma.depot.upsert({
    where: { id: 'depot-1' },
    update: {},
    create: {
      id: 'depot-1',
      name: 'Dépôt Central',
      address: 'Abidjan, Cocody',
      phone: '+22501020304',
      email: 'central@mydepot.com',
      isActive: true,
    },
  });

  const depot2 = await prisma.depot.upsert({
    where: { id: 'depot-2' },
    update: {},
    create: {
      id: 'depot-2',
      name: 'Dépôt Yopougon',
      address: 'Abidjan, Yopougon',
      phone: '+22501020305',
      email: 'yopougon@mydepot.com',
      isActive: true,
    },
  });

  console.log('✅ Depots created');

  await prisma.userDepot.createMany({
    data: [
      { userId: adminUser.id, depotId: depot1.id },
      { userId: adminUser.id, depotId: depot2.id },
    ],
    skipDuplicates: true,
  });

  const categoryBoissons = await prisma.category.upsert({
    where: { name: 'Boissons gazeuses' },
    update: {},
    create: {
      name: 'Boissons gazeuses',
      description: 'Sodas et boissons gazeuses',
      isActive: true,
    },
  });

  const categoryBieres = await prisma.category.upsert({
    where: { name: 'Bières' },
    update: {},
    create: {
      name: 'Bières',
      description: 'Bières locales et importées',
      isActive: true,
    },
  });

  const categoryEaux = await prisma.category.upsert({
    where: { name: 'Eaux' },
    update: {},
    create: {
      name: 'Eaux',
      description: 'Eaux minérales et de source',
      isActive: true,
    },
  });

  const categoryJus = await prisma.category.upsert({
    where: { name: 'Jus' },
    update: {},
    create: {
      name: 'Jus',
      description: 'Jus de fruits',
      isActive: true,
    },
  });

  console.log('✅ Categories created');

  const brandCocaCola = await prisma.brand.upsert({
    where: { name: 'Coca-Cola' },
    update: {},
    create: {
      name: 'Coca-Cola',
      description: 'The Coca-Cola Company',
      isActive: true,
    },
  });

  const brandSolibra = await prisma.brand.upsert({
    where: { name: 'SOLIBRA' },
    update: {},
    create: {
      name: 'SOLIBRA',
      description: 'Brasseries ivoiriennes',
      isActive: true,
    },
  });

  const brandAwabio = await prisma.brand.upsert({
    where: { name: 'Awabio' },
    update: {},
    create: {
      name: 'Awabio',
      description: 'Eaux minérales',
      isActive: true,
    },
  });

  console.log('✅ Brands created');

  const products = [
    {
      name: 'Coca-Cola 33cl',
      barcode: 'CC33001',
      sku: 'COCA-33',
      categoryId: categoryBoissons.id,
      brandId: brandCocaCola.id,
      depotId: depot1.id,
      purchasePrice: 200,
      sellingPrice: 300,
      minStock: 50,
    },
    {
      name: 'Coca-Cola 1L',
      barcode: 'CC1L001',
      sku: 'COCA-1L',
      categoryId: categoryBoissons.id,
      brandId: brandCocaCola.id,
      depotId: depot1.id,
      purchasePrice: 500,
      sellingPrice: 700,
      minStock: 30,
    },
    {
      name: 'Flag 65cl',
      barcode: 'FLAG65001',
      sku: 'FLAG-65',
      categoryId: categoryBieres.id,
      brandId: brandSolibra.id,
      depotId: depot1.id,
      purchasePrice: 400,
      sellingPrice: 600,
      minStock: 40,
    },
    {
      name: 'Awabio 1.5L',
      barcode: 'AWA15001',
      sku: 'AWABIO-15',
      categoryId: categoryEaux.id,
      brandId: brandAwabio.id,
      depotId: depot1.id,
      purchasePrice: 150,
      sellingPrice: 250,
      minStock: 60,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData,
    });

    await prisma.stock.create({
      data: {
        productId: product.id,
        depotId: depot1.id,
        quantity: 100,
      },
    });

    console.log(`✅ Product created: ${product.name}`);
  }

  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Société de Distribution SARL',
      phone: '+22501111111',
      email: 'contact@distribution.ci',
      address: 'Abidjan, Zone Industrielle',
      isActive: true,
    },
  });

  console.log('✅ Supplier created');

  const client1 = await prisma.client.create({
    data: {
      firstName: 'Jean',
      lastName: 'Kouassi',
      phone: '+22505555555',
      email: 'jean.kouassi@example.com',
      address: 'Abidjan, Marcory',
      isActive: true,
    },
  });

  console.log('✅ Client created');

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
