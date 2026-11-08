-- CreateTable
CREATE TABLE "PeriodRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeriodRecord_userId_startDate_idx" ON "PeriodRecord"("userId", "startDate");

-- AddForeignKey
ALTER TABLE "PeriodRecord" ADD CONSTRAINT "PeriodRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
