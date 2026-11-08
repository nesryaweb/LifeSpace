
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const goalStatuses = ["ACTIVE", "COMPLETED", "PAUSED"];
const goalTypes = ["GENERAL", "FINANCIAL"];

function calculateProgress(projectLinks) {
  const tasks = projectLinks.flatMap(
    (link) => link.project.tasks
  );

  if (tasks.length === 0) return 0;

  const completed = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  return Math.round((completed / tasks.length) * 100);
}

// Calculate the actual savings balance from jar transactions.
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

// Format financial goal information for the frontend.
function formatFinancialGoal(financialGoal) {
  if (!financialGoal) return null;

  const currentAmount = Math.max(
    0,
    calculateSavings(financialGoal.transactions)
  );

  const targetAmount = Number(financialGoal.targetAmount);

  const remainingAmount = Math.max(
    0,
    targetAmount - currentAmount
  );

  const progress =
    targetAmount > 0
      ? Math.min(
          100,
          Math.round((currentAmount / targetAmount) * 100)
        )
      : 0;

  return {
    ...financialGoal,
    targetAmount,
    currentAmount,
    remainingAmount,
    progress,
    transactions: financialGoal.transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    })),
  };
}

function formatGoal(goal) {
  return {
    ...goal,

    // Existing project task progress.
    progress: calculateProgress(goal.projectLinks),

    // Existing Vision Board connections.
    visionItems: goal.visionLinks.map(
      (link) => link.visionItem
    ),

    // Existing project connections.
    projects: goal.projectLinks.map((link) => ({
      id: link.project.id,
      title: link.project.title,
      status: link.project.status,
    })),

    // New financial goal and savings jar information.
    financialGoal: formatFinancialGoal(goal.financialGoal),
  };
}

async function getGoalRelations(userId) {
  const [visionBoard, projects] = await Promise.all([
    prisma.visionBoard.findUnique({
      where: { userId },
      select: {
        items: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            imageUrl: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),

    prisma.project.findMany({
      where: {
        userId,
        status: { not: "ARCHIVED" },
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    visionItems: visionBoard?.items ?? [],
    projects,
  };
}

// Shared financial goal selection.
const financialGoalInclude = {
  include: {
    transactions: {
      orderBy: { date: "desc" },
    },
  },
};

// Shared relations for loading and returning goals.
const goalInclude = {
  visionLinks: {
    include: {
      visionItem: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          imageUrl: true,
        },
      },
    },
  },

  projectLinks: {
    include: {
      project: {
        select: {
          id: true,
          title: true,
          status: true,
          tasks: {
            select: { status: true },
          },
        },
      },
    },
  },

  financialGoal: financialGoalInclude,
};

// ==========================================
// GET: Load goals and available relationships
// ==========================================

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const [goals, relations] = await Promise.all([
      prisma.goal.findMany({
        where: { userId },
        include: goalInclude,
        orderBy: { updatedAt: "desc" },
      }),

      getGoalRelations(userId),
    ]);

    return NextResponse.json({
      goals: goals.map(formatGoal),
      ...relations,
    });
  } catch (error) {
    console.error("Goals GET error:", error);

    return NextResponse.json(
      { message: "Could not load your goals." },
      { status: 500 }
    );
  }
}

// ==========================================
// POST: Create a general or financial goal
// ==========================================

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // --------------------------------------
    // Basic goal information
    // --------------------------------------

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    if (!title || title.length > 200) {
      return NextResponse.json(
        {
          message: "Enter a goal title (up to 200 characters).",
        },
        { status: 400 }
      );
    }

    const description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, 5000)
        : "";

    if (
      body.type !== undefined &&
      !goalTypes.includes(body.type)
    ) {
      return NextResponse.json(
        { message: "Invalid goal type." },
        { status: 400 }
      );
    }

    const type = body.type || "GENERAL";

    const status = goalStatuses.includes(body.status)
      ? body.status
      : "ACTIVE";

    let targetDate = null;

    if (body.targetDate) {
      targetDate = new Date(body.targetDate);

      if (Number.isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { message: "Please provide a valid target date." },
          { status: 400 }
        );
      }
    }

    // --------------------------------------
    // Financial goal information
    // --------------------------------------

    let financialGoalData = null;

    if (type === "FINANCIAL") {
      const targetAmount = Number(body.targetAmount);

      const currency =
        typeof body.currency === "string"
          ? body.currency.trim().toUpperCase()
          : "ETB";

      if (
        !Number.isFinite(targetAmount) ||
        targetAmount <= 0
      ) {
        return NextResponse.json(
          {
            message: "Enter a valid financial target amount.",
          },
          { status: 400 }
        );
      }

      if (!/^[A-Z]{3}$/.test(currency)) {
        return NextResponse.json(
          { message: "Enter a valid three-letter currency code." },
          { status: 400 }
        );
      }

      financialGoalData = {
        targetAmount: targetAmount.toFixed(2),
        currency,
      };
    }

    // --------------------------------------
    // Vision Board and project relationships
    // --------------------------------------

    const visionItemIds = Array.isArray(body.visionItemIds)
      ? [
          ...new Set(
            body.visionItemIds.filter(
              (id) => typeof id === "string"
            )
          ),
        ]
      : [];

    const projectIds = Array.isArray(body.projectIds)
      ? [
          ...new Set(
            body.projectIds.filter(
              (id) => typeof id === "string"
            )
          ),
        ]
      : [];

    const [visionItems, projects] = await Promise.all([
      visionItemIds.length
        ? prisma.visionItem.findMany({
            where: {
              id: { in: visionItemIds },
              board: { userId },
            },
            select: { id: true },
          })
        : [],

      projectIds.length
        ? prisma.project.findMany({
            where: {
              id: { in: projectIds },
              userId,
            },
            select: { id: true },
          })
        : [],
    ]);

    if (
      visionItems.length !== visionItemIds.length ||
      projects.length !== projectIds.length
    ) {
      return NextResponse.json(
        {
          message: "One or more selected items could not be found.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // Create goal and its savings jar
    // --------------------------------------

    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description: description || null,
        status,
        type,
        targetDate,

        visionLinks: {
          create: visionItemIds.map((visionItemId) => ({
            visionItemId,
          })),
        },

        projectLinks: {
          create: projectIds.map((projectId) => ({
            projectId,
          })),
        },

        ...(financialGoalData && {
          financialGoal: {
            create: financialGoalData,
          },
        }),
      },

      include: goalInclude,
    });

    return NextResponse.json(
      { goal: formatGoal(goal) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Goals POST error:", error);

    return NextResponse.json(
      { message: "Could not create your goal." },
      { status: 500 }
    );
  }
}
