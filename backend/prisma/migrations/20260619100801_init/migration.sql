-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "puzzlesSolved" INTEGER NOT NULL DEFAULT 0,
    "totalHintsUsed" INTEGER NOT NULL DEFAULT 0,
    "totalTimeTaken" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_history" (
    "id" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "match_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_history" (
    "id" TEXT NOT NULL,
    "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "difficulty" TEXT NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "hintsUsed" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "practice_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "players" JSONB NOT NULL,
    "board" JSONB NOT NULL,
    "solution" JSONB NOT NULL,
    "winner" TEXT,
    "gameStarted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_user_map" (
    "id" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "room_user_map_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_roomId_key" ON "rooms"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "room_user_map_roomId_socketId_key" ON "room_user_map"("roomId", "socketId");

-- AddForeignKey
ALTER TABLE "match_history" ADD CONSTRAINT "match_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_history" ADD CONSTRAINT "practice_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_user_map" ADD CONSTRAINT "room_user_map_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("roomId") ON DELETE CASCADE ON UPDATE CASCADE;
