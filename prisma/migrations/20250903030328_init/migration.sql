-- CreateTable
CREATE TABLE "public"."players" (
    "id" TEXT NOT NULL,
    "fullName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "position" TEXT,
    "team" TEXT,
    "teamAbbr" TEXT,
    "status" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "yearsExp" INTEGER,
    "age" INTEGER,
    "height" TEXT,
    "weight" TEXT,
    "college" TEXT,
    "birthDate" TEXT,
    "fantasyPositions" TEXT NOT NULL,
    "injuryStatus" TEXT,
    "injuryBodyPart" TEXT,
    "injuryNotes" TEXT,
    "depthChartPosition" TEXT,
    "depthChartOrder" INTEGER,
    "searchRank" INTEGER,
    "espnId" INTEGER,
    "yahooId" INTEGER,
    "rotowireId" INTEGER,
    "statsId" INTEGER,
    "fantasyDataId" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."player_sync_logs" (
    "id" SERIAL NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerCount" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMsg" TEXT,

    CONSTRAINT "player_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedules" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "broadcast" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teams" (
    "id" TEXT NOT NULL,
    "espnTeamId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "season" INTEGER NOT NULL DEFAULT 2025,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "winPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedules_year_week_homeTeam_awayTeam_key" ON "public"."schedules"("year", "week", "homeTeam", "awayTeam");

-- CreateIndex
CREATE UNIQUE INDEX "teams_espnTeamId_key" ON "public"."teams"("espnTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_espnTeamId_season_key" ON "public"."teams"("espnTeamId", "season");
