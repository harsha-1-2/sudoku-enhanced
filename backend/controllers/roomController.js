// controllers/roomController.js
const prisma = require("../config/prisma");

exports.getRoomInfo = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { roomId: roomId.toUpperCase() },
      include: { userMap: true }
    });

    if (!room) return res.status(404).json({ msg: "Room not found" });

    res.json(room);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};