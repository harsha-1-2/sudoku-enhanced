const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: [{ type: String }],
  board: [[Number]],           
  solution: [[Number]],
  winner: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 3600 },
  userMap: { type: Map, of: String, default: {} },
  gameStarted: { type: Boolean, default: false } // NEW FIELD
});

module.exports = mongoose.model("Room", roomSchema);