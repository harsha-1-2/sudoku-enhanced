// config/prisma.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// Retry once on transient connection errors (Neon cold-start)
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (err) {
    const isConnectionClosed =
      err.message?.includes("Closed") || err.code === "P1001" || err.code === "P1017";

    if (isConnectionClosed) {
      console.warn("Prisma connection closed — retrying once...");
      await prisma.$connect();
      return await next(params); // retry the same query once
    }
    throw err;
  }
});

module.exports = prisma;
