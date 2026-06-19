const Room = require("../models/Room");
const User = require("../models/User");
const { generateSudoku } = require("../services/sudokuGenerator");

let waitingPlayer = null;
let isMatchmaking = false; // 🔒 ACTUAL LOCK
const socketRoomMap = new Map();

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
        const loserSocketId = room.players.find(id => id !== winnerSocketId);
        const loserUserId = room.userMap.get(loserSocketId);

        if (winnerUserId) {
          await User.findByIdAndUpdate(winnerUserId, {
            $inc: { "stats.matchesPlayed": 1, "stats.wins": 1 },
            $push: { "stats.history": { result: "WIN", date: new Date() } }
          });
        }
        if (loserUserId) {
          await User.findByIdAndUpdate(loserUserId, {
            $inc: { "stats.matchesPlayed": 1 },
            $push: { "stats.history": { result: "LOSS", date: new Date() } }
          });
        }
      } catch (err) {
        console.error("Leaderboard Update Failed:", err);
      }
    }

    // =================================================================
    // ⚔️ PUBLIC MATCHMAKING
    // =================================================================
    socket.on("find_match", async () => {

      // 🔒 LOCK: If matchmaking is in progress, make this socket wait
      if (isMatchmaking) {
        socket.emit("waiting_for_match");
        return;
      }

      // 🔒 ACQUIRE LOCK
      isMatchmaking = true;

      try {
        // Check if waitingPlayer socket is still alive
        if (waitingPlayer) {
          const isAlive = io.sockets.sockets.get(waitingPlayer.id);
          if (!isAlive) {
            console.log("Cleared dead waiting player");
            waitingPlayer = null;
          }
        }

        // Prevent same user queuing twice (two tabs)
        if (waitingPlayer && waitingPlayer.data.user?.id === userId) {
          socket.emit("waiting_for_match");
          return; // finally block still runs → releases lock
        }

        if (waitingPlayer) {
          const player1 = waitingPlayer;
          const player2 = socket;
          waitingPlayer = null; // Clear before await

          const roomId = "PUB_" + Math.random().toString(36).substring(2, 7).toUpperCase();
          const { puzzle, solution } = generateSudoku();

          const newRoom = await Room.create({
            roomId,
            board: puzzle,
            solution,
            players: [player1.id, player2.id],
            winner: null,
          });

          newRoom.userMap.set(player1.id, player1.data.user?.id);
          newRoom.userMap.set(player2.id, player2.data.user?.id);
          await newRoom.save();

          socketRoomMap.set(player1.id, roomId);
          socketRoomMap.set(player2.id, roomId);

          player1.join(roomId);
          player2.join(roomId);

          io.to(player1.id).emit("match_found", { roomId });
          io.to(player2.id).emit("match_found", { roomId });

        } else {
          waitingPlayer = socket;
          socket.emit("waiting_for_match");
        }

      } catch (err) {
        console.error("Matchmaking failed:", err);
        // 🔒 CLEAN STATE on failure — don't leave a corrupted queue
        waitingPlayer = null;
        socket.emit("match_error", "Matchmaking failed, please try again");

      } finally {
        // 🔒 ALWAYS RELEASE LOCK — no matter what happens above
        isMatchmaking = false;
      }
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
          winner: room.winner || null // ✅ Tell frontend if game already ended
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

      // Clean up queue
      if (waitingPlayer && waitingPlayer.id === socket.id) {
        waitingPlayer = null;
      }

      // 🔒 Release lock if this socket was holding it somehow
      if (isMatchmaking) {
        isMatchmaking = false;
      }

      const roomId = socketRoomMap.get(socket.id);
      if (roomId) {
        try {
          const room = await Room.findOne({ roomId });

          if (room && !room.winner && room.players.length === 2) {
            const otherPlayerId = room.players.find(id => id !== socket.id);
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