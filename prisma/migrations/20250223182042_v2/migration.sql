-- CreateTable
CREATE TABLE "DailyCount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "breed" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "count" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Breeder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dailyCountId" INTEGER NOT NULL,
    "females" INTEGER NOT NULL,
    "males" INTEGER NOT NULL,
    CONSTRAINT "Breeder_dailyCountId_fkey" FOREIGN KEY ("dailyCountId") REFERENCES "DailyCount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Juvenile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dailyCountId" INTEGER NOT NULL,
    "males" INTEGER NOT NULL,
    "females" INTEGER NOT NULL,
    "unknown" INTEGER NOT NULL,
    CONSTRAINT "Juvenile_dailyCountId_fkey" FOREIGN KEY ("dailyCountId") REFERENCES "DailyCount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Breeder_dailyCountId_key" ON "Breeder"("dailyCountId");

-- CreateIndex
CREATE UNIQUE INDEX "Juvenile_dailyCountId_key" ON "Juvenile"("dailyCountId");
