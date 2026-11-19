import { prisma } from './prisma.js';

export const connectDB = async (): Promise<void> => {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log('[CA ProFlow] Connected to MySQL through Prisma');
};

export const closeDB = async (): Promise<void> => {
  await prisma.$disconnect();
};
