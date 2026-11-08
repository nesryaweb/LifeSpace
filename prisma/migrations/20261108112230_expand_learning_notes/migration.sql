/*
  Warnings:

  - The `difficulty` column on the `LearningNote` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `_LearningKeywordToLearningNote` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `meaning` to the `LearningKeyword` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LearningKeyword` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LearningNoteDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- DropForeignKey
ALTER TABLE "_LearningKeywordToLearningNote" DROP CONSTRAINT "_LearningKeywordToLearningNote_A_fkey";

-- DropForeignKey
ALTER TABLE "_LearningKeywordToLearningNote" DROP CONSTRAINT "_LearningKeywordToLearningNote_B_fkey";

-- DropIndex
DROP INDEX "LearningNote_userId_reviewDate_idx";

-- AlterTable
ALTER TABLE "LearningKeyword" ADD COLUMN     "example" TEXT,
ADD COLUMN     "meaning" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "LearningNote" DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "LearningNoteDifficulty" NOT NULL DEFAULT 'BEGINNER';

-- DropTable
DROP TABLE "_LearningKeywordToLearningNote";

-- DropEnum
DROP TYPE "LearningDifficulty";

-- CreateTable
CREATE TABLE "LearningNoteKeyword" (
    "id" TEXT NOT NULL,
    "learningNoteId" TEXT NOT NULL,
    "learningKeywordId" TEXT NOT NULL,

    CONSTRAINT "LearningNoteKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningNoteKeyword_learningNoteId_idx" ON "LearningNoteKeyword"("learningNoteId");

-- CreateIndex
CREATE INDEX "LearningNoteKeyword_learningKeywordId_idx" ON "LearningNoteKeyword"("learningKeywordId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningNoteKeyword_learningNoteId_learningKeywordId_key" ON "LearningNoteKeyword"("learningNoteId", "learningKeywordId");

-- CreateIndex
CREATE INDEX "LearningNote_userId_status_idx" ON "LearningNote"("userId", "status");

-- AddForeignKey
ALTER TABLE "LearningNoteKeyword" ADD CONSTRAINT "LearningNoteKeyword_learningNoteId_fkey" FOREIGN KEY ("learningNoteId") REFERENCES "LearningNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNoteKeyword" ADD CONSTRAINT "LearningNoteKeyword_learningKeywordId_fkey" FOREIGN KEY ("learningKeywordId") REFERENCES "LearningKeyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;
