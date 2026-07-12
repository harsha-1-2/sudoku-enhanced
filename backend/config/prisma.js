const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

let dbReady = false;

async function ensureDbConnected() {
  if (dbReady) return true;

  try {
    await prisma.$connect();
    dbReady = true;
    return true;
  } catch (err) {
    dbReady = false;
    console.error("Database connection failed:", err.message);
    return false;
  }
}

function isDbConnected() {
  return dbReady;
}

module.exports = Object.assign(prisma, {
  ensureDbConnected,
  isDbConnected,
});