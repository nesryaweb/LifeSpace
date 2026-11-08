-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('GENERAL', 'FINANCIAL');

-- CreateEnum
CREATE TYPE "FinanceTransactionType" AS ENUM ('INCOME', 'EXPENSE', 'SAVING_DEPOSIT', 'SAVING_WITHDRAWAL');

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "type" "GoalType" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "FinancialGoal" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "financialGoalId" TEXT,
    "type" "FinanceTransactionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "category" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialGoal_goalId_key" ON "FinancialGoal"("goalId");

-- CreateIndex
CREATE INDEX "FinancialGoal_currency_idx" ON "FinancialGoal"("currency");

-- CreateIndex
CREATE INDEX "FinanceTransaction_userId_date_idx" ON "FinanceTransaction"("userId", "date");

-- CreateIndex
CREATE INDEX "FinanceTransaction_financialGoalId_idx" ON "FinanceTransaction"("financialGoalId");

-- CreateIndex
CREATE INDEX "FinanceTransaction_type_idx" ON "FinanceTransaction"("type");

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_financialGoalId_fkey" FOREIGN KEY ("financialGoalId") REFERENCES "FinancialGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
