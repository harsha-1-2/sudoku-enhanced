// scripts/migrateFromMongo.js
const mongoose = require("mongoose");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

// Paste your OLD MongoDB connection string here
MONGO_URI=process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    history: [{ result: String, date: Date }]
  },
  practiceStats: {
    puzzlesSolved: { type: Number, default: 0 },
    totalHintsUsed: { type: Number, default: 0 },
    totalTimeTaken: { type: Number, default: 0 },
    history: [{ solvedAt: Date, difficulty: String, timeTaken: Number, hintsUsed: Number }]
  }
});

const MongoUser = mongoose.model("User", userSchema);

async function migrate() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");

  const mongoUsers = await MongoUser.find({});
  console.log(`Found ${mongoUsers.length} users to migrate`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of mongoUsers) {
    try {
      // Check if already migrated
      const exists = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (exists) {
        console.log(`Skipping ${user.email} — already exists`);
        skipped++;
        continue;
      }

      // Create user in PostgreSQL
      const newUser = await prisma.user.create({
        data: {
          username: user.username,
          email: user.email,
          password: user.password, // already hashed, copy as-is
          matchesPlayed: user.stats?.matchesPlayed || 0,
          wins: user.stats?.wins || 0,
          puzzlesSolved: user.practiceStats?.puzzlesSolved || 0,
          totalHintsUsed: user.practiceStats?.totalHintsUsed || 0,
          totalTimeTaken: user.practiceStats?.totalTimeTaken || 0,
        }
      });

      // Migrate match history
      if (user.stats?.history?.length > 0) {
        await prisma.matchHistory.createMany({
          data: user.stats.history.map(h => ({
            userId: newUser.id,
            result: h.result,
            date: h.date || new Date()
          }))
        });
      }

      // Migrate practice history
      if (user.practiceStats?.history?.length > 0) {
        await prisma.practiceHistory.createMany({
          data: user.practiceStats.history.map(h => ({
            userId: newUser.id,
            solvedAt: h.solvedAt || new Date(),
            difficulty: h.difficulty || "medium",
            timeTaken: h.timeTaken || 0,
            hintsUsed: h.hintsUsed || 0
          }))
        });
      }

      console.log(`✅ Migrated: ${user.email}`);
      success++;
    } catch (err) {
      console.error(`❌ Failed: ${user.email} — ${err.message}`);
      failed++;
    }
  }

  console.log("\n=== Migration Complete ===");
  console.log(`✅ Success: ${success}`);
  console.log(`⏭  Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${failed}`);

  await mongoose.disconnect();
  await prisma.$disconnect();
}

migrate().catch(console.error);