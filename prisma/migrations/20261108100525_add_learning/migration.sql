-- CreateEnum
CREATE TYPE "LearningPathStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LearningResourceType" AS ENUM ('BOOK', 'VIDEO', 'WEBSITE', 'COURSE', 'ARTICLE', 'OTHER');

-- CreateEnum
CREATE TYPE "LearningLessonStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LearningPathStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningResource" (
    "id" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LearningResourceType" NOT NULL DEFAULT 'OTHER',
    "url" TEXT,
    "author" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningLesson" (
    "id" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LearningLessonStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "lessonId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningPath_userId_idx" ON "LearningPath"("userId");

-- CreateIndex
CREATE INDEX "LearningPath_goalId_idx" ON "LearningPath"("goalId");

-- CreateIndex
CREATE INDEX "LearningPath_userId_status_idx" ON "LearningPath"("userId", "status");

-- CreateIndex
CREATE INDEX "LearningResource_learningPathId_idx" ON "LearningResource"("learningPathId");

-- CreateIndex
CREATE INDEX "LearningLesson_learningPathId_idx" ON "LearningLesson"("learningPathId");

-- CreateIndex
CREATE INDEX "LearningLesson_learningPathId_status_idx" ON "LearningLesson"("learningPathId", "status");

-- CreateIndex
CREATE INDEX "LearningNote_userId_idx" ON "LearningNote"("userId");

-- CreateIndex
CREATE INDEX "LearningNote_learningPathId_idx" ON "LearningNote"("learningPathId");

-- CreateIndex
CREATE INDEX "LearningNote_lessonId_idx" ON "LearningNote"("lessonId");

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningResource" ADD CONSTRAINT "LearningResource_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningLesson" ADD CONSTRAINT "LearningLesson_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNote" ADD CONSTRAINT "LearningNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNote" ADD CONSTRAINT "LearningNote_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningNote" ADD CONSTRAINT "LearningNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LearningLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
