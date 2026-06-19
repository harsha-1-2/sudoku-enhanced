const express = require("express");
const router = express.Router();
const { generateSudoku } = require("../services/sudokuGenerator");
const { getHint } = require("../services/hintEngine");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

// GET /api/sudoku/generate
router.get("/generate", (req, res) => {
  try {
    const { puzzle, solution } = generateSudoku();
    res.json({ puzzle, solution });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// POST /api/sudoku/hint
// Body: { board, solution }
router.post("/hint", auth, (req, res) => {
  try {
    const { board, solution } = req.body;
    if (!board || !solution) return res.status(400).json({ msg: "board and solution required" });
    const hint = getHint(board, solution);
    if (!hint) return res.json({ msg: "Board is already complete!" });
    res.json(hint);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// POST /api/sudoku/complete
// Called when player solves a puzzle — saves to DB
router.post("/complete", auth, async (req, res) => {
  try {
    const { timeTaken, hintsUsed, difficulty = "medium" } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      $inc: {
        "stats.practiceStats.puzzlesSolved": 1,
        "stats.practiceStats.totalHintsUsed": hintsUsed || 0,
        "stats.practiceStats.totalTimeTaken": timeTaken || 0,
      },
      $push: {
        "stats.practiceStats.history": {
          solvedAt: new Date(),
          difficulty,
          timeTaken: timeTaken || 0,
          hintsUsed: hintsUsed || 0,
        }
      }
    });

    res.json({ msg: "Progress saved" });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// GET /api/sudoku/stats
// Returns practice stats for the logged in user
router.get("/stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("stats.practiceStats username");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;