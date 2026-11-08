-- CreateEnum
CREATE TYPE "LearningNoteType" AS ENUM ('CONCEPT', 'TUTORIAL', 'VOCABULARY', 'RESEARCH', 'SUMMARY', 'PROBLEM_SOLUTION', 'OTHER');

-- CreateEnum
CREATE TYPE "LearningNoteStatus" AS ENUM ('NOT_UNDERSTOOD', 'LEARNING', 'UNDERSTOOD');

-- CreateEnum
CREATE TYPE "LearningDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "LearningNote" ADD COLUMN     "difficulty" "LearningDifficulty" NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "examples" TEXT,
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keyTakeaways" TEXT,
ADD COLUMN     "questions" TEXT,
ADD COLUMN     "reviewDate" TIMESTAMP(3),
ADD COLUMN     "status" "LearningNoteStatus" NOT NULL DEFAULT 'LEARNING',
ADD COLUMN     "type" "LearningNoteType" NOT NULL DEFAULT 'CONCEPT';

-- CreateTable
CREATE TABLE "LearningKeyword" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LearningKeywordToLearningNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LearningKeywordToLearningNote_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "LearningKeyword_userId_idx" ON "LearningKeyword"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningKeyword_userId_normalizedName_key" ON "LearningKeyword"("userId", "normalizedName");

-- CreateIndex
CREATE INDEX "_LearningKeywordToLearningNote_B_index" ON "_LearningKeywordToLearningNote"("B");

-- CreateIndex
CREATE INDEX "LearningNote_userId_isFavorite_idx" ON "LearningNote"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "LearningNote_userId_reviewDate_idx" ON "LearningNote"("userId", "reviewDate");

-- AddForeignKey
ALTER TABLE "LearningKeyword" ADD CONSTRAINT "LearningKeyword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LearningKeywordToLearningNote" ADD CONSTRAINT "_LearningKeywordToLearningNote_A_fkey" FOREIGN KEY ("A") REFERENCES "LearningKeyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LearningKeywordToLearningNote" ADD CONSTRAINT "_LearningKeywordToLearningNote_B_fkey" FOREIGN KEY ("B") REFERENCES "LearningNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
