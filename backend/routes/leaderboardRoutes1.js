const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET /api/leaderboard
router.get("/", async (req, res) => {
  try {
    // 1. Fetch Users
    // 2. Select only username and stats fields (exclude passwords!)
    // 3. Sort by Wins (Descending)
    // 4. Limit to Top 50 (for performance)
    const leaders = await User.find({})
      .select("username stats") 
      .sort({ "stats.wins": -1 }) 
      .limit(50);

    // Format the data for frontend
    const formattedLeaders = leaders.map(user => ({
      username: user.username,
      wins: user.stats?.wins || 0,
      matches: user.stats?.matchesPlayed || 0,
      winRate: user.stats?.matchesPlayed > 0 
        ? Math.round((user.stats.wins / user.stats.matchesPlayed) * 100) 
        : 0
    }));

    res.json(formattedLeaders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;