import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Set it in the backend root .env file before starting the API.');
}

const databaseUrl = new URL(connectionString);

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.replace(/^\//, ''),
  connectionLimit: 10,
});

export const prisma = new PrismaClient({ adapter });
