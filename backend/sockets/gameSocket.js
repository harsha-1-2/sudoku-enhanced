const prisma = require("../config/prisma");
const { generateSudoku } = require("../services/sudokuGenerator");

let waitingPlayer = null;
let isMatchmaking = false;
const socketRoomMap = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.data.user?.id;

    console.log(`Socket connected: ${socket.id} | userId: ${userId}`);

    if (!userId) {
      console.log("No userId — disconnecting socket");
      socket.disconnect(true);
      return;
    }

    // =================================================================
    // 🏆 STATS LOGIC
    // =================================================================
    async function updateUserStats(winnerSocketId, room) {
      try {
        const winnerEntry = room.userMap.find(e => e.socketId === winnerSocketId);
        const loserEntry  = room.userMap.find(e => e.socketId !== winnerSocketId);

        if (winnerEntry?.userId) {
          await prisma.user.update({
            where: { id: winnerEntry.userId },
            data: {
              matchesPlayed: { increment: 1 },
              wins: { increment: 1 },
              matchHistory: { create: { result: "WIN" } }
            }
          });
        }

        if (loserEntry?.userId) {
          await prisma.user.update({
            where: { id: loserEntry.userId },
            data: {
              matchesPlayed: { increment: 1 },
              matchHistory: { create: { result: "LOSS" } }
            }
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
      if (isMatchmaking) {
        socket.emit("waiting_for_match");
        return;
      }

      isMatchmaking = true;

      try {
        // Clean dead waiting player
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
          isMatchmaking = false;
          return;
        }

        if (waitingPlayer) {
          const player1 = waitingPlayer;
          const player2 = socket;
          waitingPlayer = null;

          const roomId = "PUB_" + Math.random().toString(36).substring(2, 7).toUpperCase();
          const { puzzle, solution } = generateSudoku();

          console.log(`Creating room ${roomId} for ${player1.id} and ${player2.id}`);

          await prisma.room.create({
            data: {
              roomId,
              board: puzzle,
              solution,
              players: [player1.id, player2.id],
              winner: null,
              userMap: {
                create: [
                  { socketId: player1.id, userId: player1.data.user?.id },
                  { socketId: player2.id, userId: player2.data.user?.id },
                ]
              }
            }
          });

          socketRoomMap.set(player1.id, roomId);
          socketRoomMap.set(player2.id, roomId);

          player1.join(roomId);
          player2.join(roomId);

          console.log(`Match found! Room: ${roomId}`);

          io.to(player1.id).emit("match_found", { roomId });
          io.to(player2.id).emit("match_found", { roomId });

        } else {
          waitingPlayer = socket;
          console.log(`Player waiting: ${socket.id}`);
          socket.emit("waiting_for_match");
        }

      } catch (err) {
        console.error("Matchmaking failed:", err);
        waitingPlayer = null;
        socket.emit("match_error", "Matchmaking failed, please try again");
      } finally {
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

        await prisma.room.create({
          data: {
            roomId,
            board: puzzle,
            solution,
            players: [socket.id],
            winner: null,
            userMap: {
              create: [{ socketId: socket.id, userId }]
            }
          }
        });

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
        const room = await prisma.room.findUnique({
          where: { roomId: roomId.toUpperCase() },
          include: { userMap: true }
        });

        if (!room) return socket.emit("room_error", "Room not found");

        socket.join(roomId);
        socketRoomMap.set(socket.id, roomId);

        const alreadyInRoom = room.players.includes(socket.id);
        if (!alreadyInRoom) {
          await prisma.room.update({
            where: { roomId: roomId.toUpperCase() },
            data: {
              players: { push: socket.id },
              userMap: {
                create: [{ socketId: socket.id, userId }]
              }
            }
          });
        }

        socket.emit("joined_room", room.board);
        io.to(roomId).emit("player_joined", {
          count: room.players.length + (alreadyInRoom ? 0 : 1),
          winner: room.winner || null
        });

        const updatedCount = alreadyInRoom ? room.players.length : room.players.length + 1;
        if (updatedCount === 2 && !room.winner) {
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
        const room = await prisma.room.findUnique({
          where: { roomId },
          include: { userMap: true }
        });

        if (!room || room.winner) return;

        const isCorrect = JSON.stringify(board) === JSON.stringify(room.solution);

        if (isCorrect) {
          await prisma.room.update({
            where: { roomId },
            data: { winner: socket.id }
          });

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

      if (waitingPlayer && waitingPlayer.id === socket.id) {
        waitingPlayer = null;
      }

      if (isMatchmaking) {
        isMatchmaking = false;
      }

      const roomId = socketRoomMap.get(socket.id);
      if (roomId) {
        try {
          const room = await prisma.room.findUnique({
            where: { roomId },
            include: { userMap: true }
          });

          if (room && !room.winner && room.players.length === 2) {
            const otherSocketId = room.players.find(id => id !== socket.id);
            if (otherSocketId) {
              await prisma.room.update({
                where: { roomId },
                data: { winner: otherSocketId }
              });

              io.to(roomId).emit("game_over", { winnerId: otherSocketId });
              await updateUserStats(otherSocketId, room);

              const otherSocket = io.sockets.sockets.get(otherSocketId);
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