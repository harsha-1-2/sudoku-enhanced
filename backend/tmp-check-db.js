require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

prisma.$connect()
  .then(() => {
    console.log('DB_OK');
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error('DB_FAIL', err.message);
    process.exit(1);
  });
