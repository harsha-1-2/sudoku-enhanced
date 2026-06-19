const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    // Optional: Keeps a log of last 50 matches results
    history: [
      {
        result: { type: String, enum: ["WIN", "LOSS"] },
        date: { type: Date, default: Date.now }
      }
    ]
  },
  createdAt: { type: Date, default: Date.now },

practiceStats: {
  puzzlesSolved: { type: Number, default: 0 },
  totalHintsUsed: { type: Number, default: 0 },
  totalTimeTaken: { type: Number, default: 0 }, // in seconds
  history: [{
    solvedAt: { type: Date, default: Date.now },
    difficulty: String,
    timeTaken: Number,
    hintsUsed: Number,
  }]
}
});

module.exports = mongoose.model("User", userSchema);
