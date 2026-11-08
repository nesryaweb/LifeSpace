-- CreateEnum
CREATE TYPE "JournalEntryType" AS ENUM ('DAILY', 'GRATITUDE', 'BRAIN_DUMP', 'REFLECTION', 'IDEA');

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "type" "JournalEntryType" NOT NULL DEFAULT 'DAILY',
    "mood" TEXT,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalEntry_userId_entryDate_idx" ON "JournalEntry"("userId", "entryDate");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_type_idx" ON "JournalEntry"("userId", "type");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
