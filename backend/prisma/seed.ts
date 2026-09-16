import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12);
  const validatorPassword = await bcrypt.hash('validator123', 12);
  const technicianPassword = await bcrypt.hash('tech123', 12);
  const viewerPassword = await bcrypt.hash('viewer123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      email: 'admin@portal.local',
      fullName: 'Administrator',
      role: UserRole.ADMIN,
      password: adminPassword,
      mustChangePw: false,
    },
    create: {
      username: 'admin',
      email: 'admin@portal.local',
      fullName: 'Administrator',
      role: UserRole.ADMIN,
      password: adminPassword,
      mustChangePw: false,
    },
  });

  const validator = await prisma.user.upsert({
    where: { username: 'validator' },
    update: {
      email: 'validator@portal.local',
      fullName: 'Validator User',
      role: UserRole.VALIDATOR,
      password: validatorPassword,
      mustChangePw: false,
    },
    create: {
      username: 'validator',
      email: 'validator@portal.local',
      fullName: 'Validator User',
      role: UserRole.VALIDATOR,
      password: validatorPassword,
      mustChangePw: false,
    },
  });

  const technician = await prisma.user.upsert({
    where: { username: 'technician' },
    update: {
      email: 'tech@portal.local',
      fullName: 'Teknisi FO',
      role: UserRole.TECHNICIAN,
      password: technicianPassword,
      mustChangePw: false,
    },
    create: {
      username: 'technician',
      email: 'tech@portal.local',
      fullName: 'Teknisi FO',
      role: UserRole.TECHNICIAN,
      password: technicianPassword,
      mustChangePw: false,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { username: 'viewer' },
    update: {
      email: 'viewer@portal.local',
      fullName: 'Viewer User',
      role: UserRole.VIEWER,
      password: viewerPassword,
      mustChangePw: false,
    },
    create: {
      username: 'viewer',
      email: 'viewer@portal.local',
      fullName: 'Viewer User',
      role: UserRole.VIEWER,
      password: viewerPassword,
      mustChangePw: false,
    },
  });

  const sampleKhsItems = [
    {
      khsVersion: 'v1.0',
      itemCode: 'KHS_SMUO_001_M',
      itemName: 'Pengadaan dan pemasangan Kabel ADSS Fiber Optik Single Mode 12 core G 652 D pada duct / tanam',
      unit: 'KM',
      referencePrice: 8200,
    },
    {
      khsVersion: 'v1.0',
      itemCode: 'KHS_SMUO_002_M',
      itemName: 'Pengadaan dan pemasangan Kabel ADSS Fiber Optik Single Mode 24 core G 652 D pada duct / tanam',
      unit: 'KM',
      referencePrice: 9800,
    },
    {
      khsVersion: 'v1.0',
      itemCode: 'KHS_SMUO_003_M',
      itemName: 'Pengadaan dan pemasangan Kabel ADSS Fiber Optik Single Mode 48 core G 652 D pada duct / tanam',
      unit: 'KM',
      referencePrice: 15300,
    },
    {
      khsVersion: 'v1.0',
      itemCode: 'KHS_SMUO_001_S',
      itemName: 'Pengadaan dan pemasangan Kabel ADSS Fiber Optik Single Mode 12 core G 652 D pada duct / tanam',
      unit: 'KM',
      referencePrice: 4600,
    },
    {
      khsVersion: 'v1.0',
      itemCode: 'KHS_SMUO_013_S',
      itemName: 'Pekerjaan Pengukuran Dengan OTDR',
      unit: 'LS',
      referencePrice: 28300,
    },
  ];

  for (const item of sampleKhsItems) {
    await prisma.khsItem.upsert({
      where: { khsVersion_itemCode: { khsVersion: item.khsVersion, itemCode: item.itemCode } },
      update: {
        itemName: item.itemName,
        unit: item.unit,
        referencePrice: item.referencePrice,
      },
      create: item,
    });
  }

  console.log('Database seeded successfully');
  console.log('Users:', { admin, validator, technician, viewer });
  console.log('KHS items seeded:', sampleKhsItems.length);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
