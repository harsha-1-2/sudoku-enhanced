// controllers/roomController.js
const Room = require("../models/Room");

exports.getRoomInfo = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ msg: "Room not found" });
    }
    
    res.json(room);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};