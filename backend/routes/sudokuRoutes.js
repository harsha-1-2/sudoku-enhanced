// routes/sudokuRoutes.js
const express = require("express");
const router = express.Router();
const { generateSudoku } = require("../services/sudokuGenerator");
const { getHint } = require("../services/hintEngine");
const auth = require("../middleware/authMiddleware");
const prisma = require("../config/prisma");

router.get("/generate", (req, res) => {
  try {
    const { puzzle, solution } = generateSudoku();
    res.json({ puzzle, solution });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

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

router.post("/complete", auth, async (req, res) => {
  try {
    const { timeTaken, hintsUsed, difficulty = "medium" } = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        puzzlesSolved:  { increment: 1 },
        totalHintsUsed: { increment: hintsUsed || 0 },
        totalTimeTaken: { increment: timeTaken || 0 },
        practiceHistory: {
          create: {
            difficulty,
            timeTaken: timeTaken || 0,
            hintsUsed: hintsUsed || 0,
          }
        }
      }
    });

    res.json({ msg: "Progress saved" });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/stats", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        username: true,
        puzzlesSolved: true,
        totalHintsUsed: true,
        totalTimeTaken: true,
        practiceHistory: {
          orderBy: { solvedAt: "desc" },
          take: 50,
        }
      }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;