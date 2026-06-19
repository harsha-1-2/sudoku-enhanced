// routes/leaderboardRoutes.js
const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

router.get("/", async (req, res) => {
  try {
    const leaders = await prisma.user.findMany({
      select: {
        username: true,
        wins: true,
        matchesPlayed: true,
      },
      orderBy: { wins: "desc" },
      take: 50,
    });

    const formattedLeaders = leaders.map(user => ({
      username: user.username,
      wins: user.wins,
      matches: user.matchesPlayed,
      winRate: user.matchesPlayed > 0
        ? Math.round((user.wins / user.matchesPlayed) * 100)
        : 0
    }));

    res.json(formattedLeaders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;