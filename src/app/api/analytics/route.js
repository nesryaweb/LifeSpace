
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function calculateTaskProgress(tasks = []) {
  if (!tasks.length) return 0;

  const completed = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  return Math.round((completed / tasks.length) * 100);
}

function calculateSavings(transactions = []) {
  return transactions.reduce((total, transaction) => {
    const amount = Number(transaction.amount);

    if (transaction.type === "SAVING_DEPOSIT") {
      return total + amount;
    }

    if (transaction.type === "SAVING_WITHDRAWAL") {
      return total - amount;
    }

    return total;
  }, 0);
}

function formatGoal(goal) {
  const tasks = goal.projectLinks.flatMap(
    (link) => link.project.tasks
  );

  const financialGoal = goal.financialGoal;

  let formattedFinancialGoal = null;

  if (financialGoal) {
    const currentAmount = Math.max(
      0,
      calculateSavings(financialGoal.transactions)
    );

    const targetAmount = Number(financialGoal.targetAmount);

    formattedFinancialGoal = {
      targetAmount,
      currentAmount,
      remainingAmount: Math.max(
        0,
        targetAmount - currentAmount
      ),
      progress:
        targetAmount > 0
          ? Math.min(
              100,
              Math.round((currentAmount / targetAmount) * 100)
            )
          : 0,
      currency: financialGoal.currency,
    };
  }

  return {
    id: goal.id,
    title: goal.title,
    status: goal.status,
    type: goal.type,
    targetDate: goal.targetDate,
    progress: calculateTaskProgress(tasks),
    projectCount: goal.projectLinks.length,
    financialGoal: formattedFinancialGoal,
  };
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const [
      tasks,
      projects,
      goals,
      transactions,
      learningPaths,
      journalEntries,
      periodRecords,
    ] = await Promise.all([
      prisma.task.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          completedAt: true,
          createdAt: true,
          parentId: true,
        },
      }),

      prisma.project.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              tasks: true,
              milestones: true,
            },
          },
          tasks: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),

      prisma.goal.findMany({
        where: { userId },
        include: {
          projectLinks: {
            include: {
              project: {
                select: {
                  tasks: {
                    select: {
                      status: true,
                    },
                  },
                },
              },
            },
          },
          financialGoal: {
            include: {
              transactions: {
                select: {
                  type: true,
                  amount: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),

      prisma.financeTransaction.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          title: true,
          amount: true,
          currency: true,
          category: true,
          date: true,
          financialGoalId: true,
        },
        orderBy: { date: "desc" },
      }),

      prisma.learningPath.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          targetDate: true,
          createdAt: true,
          lessons: {
            select: {
              id: true,
              title: true,
              status: true,
              completedAt: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),

      prisma.journalEntry.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          type: true,
          mood: true,
          entryDate: true,
          createdAt: true,
        },
        orderBy: { entryDate: "desc" },
      }),

      prisma.periodRecord.findMany({
        where: { userId },
        select: {
          id: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { startDate: "desc" },
      }),
    ]);

    const formattedProjects = projects.map((project) => {
      const completedTaskCount = project.tasks.filter(
        (task) => task.status === "DONE"
      ).length;

      return {
        id: project.id,
        title: project.title,
        status: project.status,
        priority: project.priority,
        dueDate: project.dueDate,
        createdAt: project.createdAt,
        taskCount: project._count.tasks,
        milestoneCount: project._count.milestones,
        completedTaskCount,
        progress: calculateTaskProgress(project.tasks),
      };
    });

    const formattedLearningPaths = learningPaths.map((path) => {
      const completedLessons = path.lessons.filter(
        (lesson) => lesson.status === "COMPLETED"
      ).length;

      return {
        ...path,
        completedLessons,
        totalLessons: path.lessons.length,
        progress:
          path.lessons.length > 0
            ? Math.round(
                (completedLessons / path.lessons.length) * 100
              )
            : 0,
      };
    });

    const formattedTransactions = transactions.map(
      (transaction) => ({
        ...transaction,
        amount: Number(transaction.amount),
      })
    );

    return NextResponse.json({
      generatedAt: new Date().toISOString(),

      tasks,

      projects: formattedProjects,

      goals: goals.map(formatGoal),

      transactions: formattedTransactions,

      learningPaths: formattedLearningPaths,

      journalEntries,

      periodRecords,

    });
  } catch (error) {
    console.error("Analytics GET error:", error);

    return NextResponse.json(
      { error: "Could not load analytics data." },
      { status: 500 }
    );
  }
}
