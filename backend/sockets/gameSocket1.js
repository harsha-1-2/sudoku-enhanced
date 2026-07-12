const Room = require("../models/Room");
const User = require("../models/User");
const { generateSudoku } = require("../services/sudokuGenerator");

// =====================================================================
// PUBLIC MATCHMAKING STATE
// =====================================================================
const matchQueue = [];
const queuedUserIds = new Set();
const socketRoomMap = new Map();

// simple per-user cooldown to reduce spam
const lastActionAt = new Map();
const ACTION_COOLDOWN_MS = 1000;

function isRateLimited(userId) {
  const now = Date.now();
  const last = lastActionAt.get(userId) || 0;

  if (now - last < ACTION_COOLDOWN_MS) {
    return true;
  }

  lastActionAt.set(userId, now);
  return false;
}

function removeSocketFromQueue(socketId) {
  const queueIndex = matchQueue.findIndex((entry) => entry.id === socketId);
  if (queueIndex === -1) return false;

  const removedSocket = matchQueue.splice(queueIndex, 1)[0];
  const removedUserId = removedSocket?.data?.user?.id;

  if (removedUserId) {
    queuedUserIds.delete(removedUserId);
  }

  return true;
}

function requeueSocket(socket) {
  if (!socket?.data?.user?.id) return;

  if (queuedUserIds.has(socket.data.user.id)) {
    return;
  }

  queuedUserIds.add(socket.data.user.id);
  matchQueue.unshift(socket);
}

function tryFormMatches(io) {
  while (matchQueue.length >= 2) {
    const player1 = matchQueue.shift();
    const player2 = matchQueue.shift();

    if (!player1 || !player2) break;

    const player1UserId = player1.data?.user?.id;
    const player2UserId = player2.data?.user?.id;

    if (player1UserId) queuedUserIds.delete(player1UserId);
    if (player2UserId) queuedUserIds.delete(player2UserId);

    const alivePlayer1 = io.sockets.sockets.get(player1.id);
    const alivePlayer2 = io.sockets.sockets.get(player2.id);

    if (!alivePlayer1) {
      if (alivePlayer2) requeueSocket(alivePlayer2);
      continue;
    }

    if (!alivePlayer2) {
      requeueSocket(alivePlayer1);
      continue;
    }

    if (player1UserId && player1UserId === player2UserId) {
      alivePlayer1.emit("waiting_for_match");
      alivePlayer2.emit("waiting_for_match");
      continue;
    }

    void createMatch(io, alivePlayer1, alivePlayer2);
  }
}

async function createMatch(io, player1, player2) {
  try {
    const roomId = "PUB_" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const { puzzle, solution } = generateSudoku();

    const newRoom = await Room.create({
      roomId,
      board: puzzle,
      solution,
      players: [player1.id, player2.id],
      winner: null,
    });

    newRoom.userMap.set(player1.id, player1.data?.user?.id);
    newRoom.userMap.set(player2.id, player2.data?.user?.id);
    await newRoom.save();

    socketRoomMap.set(player1.id, roomId);
    socketRoomMap.set(player2.id, roomId);

    player1.join(roomId);
    player2.join(roomId);

    player1.emit("match_found", { roomId });
    player2.emit("match_found", { roomId });
  } catch (err) {
    console.error("Matchmaking failed:", err);

    requeueSocket(player1);
    requeueSocket(player2);
    tryFormMatches(io);

    player1.emit("match_error", "Matchmaking failed, requeued you automatically");
    player2.emit("match_error", "Matchmaking failed, requeued you automatically");
  }
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.data.user?.id;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    console.log(`Socket connected: ${socket.id} | User: ${userId}`);

    // =================================================================
    // 🏆 STATS LOGIC
    // =================================================================
    async function updateUserStats(winnerSocketId, room) {
      try {
        const winnerUserId = room.userMap.get(winnerSocketId);
        const loserSocketId = room.players.find((id) => id !== winnerSocketId);
        const loserUserId = room.userMap.get(loserSocketId);

        if (winnerUserId) {
          await User.findByIdAndUpdate(winnerUserId, {
            $inc: { "stats.matchesPlayed": 1, "stats.wins": 1 },
            $push: { "stats.history": { result: "WIN", date: new Date() } },
          });
        }
        if (loserUserId) {
          await User.findByIdAndUpdate(loserUserId, {
            $inc: { "stats.matchesPlayed": 1 },
            $push: { "stats.history": { result: "LOSS", date: new Date() } },
          });
        }
      } catch (err) {
        console.error("Leaderboard Update Failed:", err);
      }
    }

    // =================================================================
    // ⚔️ PUBLIC MATCHMAKING
    // =================================================================
    socket.on("find_match", () => {
      if (isRateLimited(userId)) {
        socket.emit("waiting_for_match");
        return;
      }

      if (queuedUserIds.has(userId)) {
        socket.emit("waiting_for_match");
        return;
      }

      queuedUserIds.add(userId);
      matchQueue.push(socket);

      socket.emit("waiting_for_match");
      tryFormMatches(io);
    });

    socket.on("cancel_find_match", () => {
      removeSocketFromQueue(socket.id);
      socket.emit("match_cancelled");
    });

    // =================================================================
    // 🔒 PRIVATE ROOM LOGIC
    // =================================================================
    socket.on("create_room", async () => {
      try {
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        const { puzzle, solution } = generateSudoku();

        const newRoom = await Room.create({
          roomId,
          board: puzzle,
          solution,
          players: [socket.id],
          winner: null,
        });

        newRoom.userMap.set(socket.id, userId);
        await newRoom.save();

        socket.join(roomId);
        socketRoomMap.set(socket.id, roomId);
        socket.emit("room_created", { roomId, board: puzzle });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("join_room", async (data) => {
      try {
        const roomId = (data && data.roomId) ? data.roomId : data;
        const room = await Room.findOne({ roomId: roomId.toUpperCase() });
        if (!room) return socket.emit("room_error", "Room not found");

        socket.join(roomId);
        socketRoomMap.set(socket.id, roomId);

        const alreadyInRoom = room.players.includes(socket.id);
        if (!alreadyInRoom) {
          room.players.push(socket.id);
          room.userMap.set(socket.id, userId);
          await room.save();
        }

        socket.emit("joined_room", room.board);
        io.to(roomId).emit("player_joined", {
          count: room.players.length,
          winner: room.winner || null,
        });

        if (room.players.length === 2 && !room.winner) {
          io.to(roomId).emit("start_game");
        }
      } catch (err) {
        console.error(err);
      }
    });

    // =================================================================
    // ✅ WIN LOGIC
    // =================================================================
    socket.on("submit_board", async ({ roomId, board }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room || room.winner) return;

        const isCorrect = JSON.stringify(board) === JSON.stringify(room.solution);

        if (isCorrect) {
          room.winner = socket.id;
          await room.save();
          io.to(roomId).emit("game_over", { winnerId: socket.id });
          await updateUserStats(socket.id, room);
        } else {
          socket.emit("wrong_solution");
        }
      } catch (err) {
        console.error(err);
      }
    });

    // =================================================================
    // 🚪 DISCONNECT & FORFEIT
    // =================================================================
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id} | User: ${userId}`);

      removeSocketFromQueue(socket.id);

      const roomId = socketRoomMap.get(socket.id);
      if (roomId) {
        try {
          const room = await Room.findOne({ roomId });

          if (room && !room.winner && room.players.length === 2) {
            const otherPlayerId = room.players.find((id) => id !== socket.id);
            if (otherPlayerId) {
              const otherSocket = io.sockets.sockets.get(otherPlayerId);

              room.winner = otherPlayerId;
              await room.save();

              io.to(roomId).emit("game_over", { winnerId: otherPlayerId });
              await updateUserStats(otherPlayerId, room);

              if (otherSocket) {
                otherSocket.emit("opponent_disconnected");
              }
            }
          }
          socketRoomMap.delete(socket.id);
        } catch (err) {
          console.error(err);
        }
      }
    });
  });
};