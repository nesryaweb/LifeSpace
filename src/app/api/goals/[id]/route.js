
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

function formatFinancialGoal(financialGoal) {
  if (!financialGoal) return null;

  const currentAmount = Math.max(
    0,
    calculateSavings(financialGoal.transactions)
  );

  const targetAmount = Number(financialGoal.targetAmount);

  return {
    ...financialGoal,
    targetAmount,
    currentAmount,
    remainingAmount: Math.max(0, targetAmount - currentAmount),
    progress:
      targetAmount > 0
        ? Math.min(
            100,
            Math.round((currentAmount / targetAmount) * 100)
          )
        : 0,
    transactions: financialGoal.transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    })),
  };
}

function formatGoal(goal) {
  return {
    ...goal,
    progress: calculateProgress(goal.projectLinks),
    visionItems: goal.visionLinks.map(
      (link) => link.visionItem
    ),
    projects: goal.projectLinks.map((link) => ({
      id: link.project.id,
      title: link.project.title,
      status: link.project.status,
    })),
    financialGoal: formatFinancialGoal(goal.financialGoal),
  };
}

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

  financialGoal: {
    include: {
      transactions: {
        orderBy: { date: "desc" },
      },
    },
  },
};

// ==========================================
// PATCH: Update a goal and its relationships
// ==========================================

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;
    const body = await request.json();

    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId },
      select: {
        id: true,
        type: true,
        financialGoal: {
          select: {
            id: true,
            targetAmount: true,
            currency: true,
            _count: {
              select: {
                transactions: true,
              },
            },
          },
        },
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { message: "Goal not found." },
        { status: 404 }
      );
    }

    const data = {};

    // --------------------------------------
    // Basic goal information
    // --------------------------------------

    if (body.title !== undefined) {
      if (
        typeof body.title !== "string" ||
        !body.title.trim() ||
        body.title.trim().length > 200
      ) {
        return NextResponse.json(
          { message: "Enter a valid goal title." },
          { status: 400 }
        );
      }

      data.title = body.title.trim();
    }

    if (body.description !== undefined) {
      data.description =
        typeof body.description === "string"
          ? body.description.trim().slice(0, 5000) || null
          : null;
    }

    if (body.status !== undefined) {
      if (!goalStatuses.includes(body.status)) {
        return NextResponse.json(
          { message: "Invalid goal status." },
          { status: 400 }
        );
      }

      data.status = body.status;
    }

    if (body.targetDate !== undefined) {
      if (!body.targetDate) {
        data.targetDate = null;
      } else {
        const date = new Date(body.targetDate);

        if (Number.isNaN(date.getTime())) {
          return NextResponse.json(
            { message: "Please provide a valid target date." },
            { status: 400 }
          );
        }

        data.targetDate = date;
      }
    }

    // --------------------------------------
    // Goal type
    // --------------------------------------

    if (
      body.type !== undefined &&
      !goalTypes.includes(body.type)
    ) {
      return NextResponse.json(
        { message: "Invalid goal type." },
        { status: 400 }
      );
    }

    const nextType = body.type ?? existingGoal.type;

    data.type = nextType;

    // --------------------------------------
    // Financial goal information
    // --------------------------------------

    let financialGoalData = null;

    if (nextType === "FINANCIAL") {
      const existingFinancialGoal = existingGoal.financialGoal;

      let targetAmount =
        body.targetAmount !== undefined
          ? Number(body.targetAmount)
          : existingFinancialGoal
            ? Number(existingFinancialGoal.targetAmount)
            : null;

      const currency =
        body.currency !== undefined
          ? typeof body.currency === "string"
            ? body.currency.trim().toUpperCase()
            : ""
          : existingFinancialGoal?.currency || "ETB";

      if (
        targetAmount === null ||
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

    // Do not allow a financial goal with recorded transactions
    // to be converted into a general goal.
    if (
      nextType === "GENERAL" &&
      existingGoal.financialGoal?._count.transactions > 0
    ) {
      return NextResponse.json(
        {
          message:
            "This financial goal has savings transactions. Remove or transfer its transactions before changing it to a general goal.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // Vision Board connections
    // --------------------------------------

    let visionItemIds;

    if (body.visionItemIds !== undefined) {
      if (!Array.isArray(body.visionItemIds)) {
        return NextResponse.json(
          { message: "Invalid Vision Board selections." },
          { status: 400 }
        );
      }

      visionItemIds = [
        ...new Set(
          body.visionItemIds.filter(
            (itemId) => typeof itemId === "string"
          )
        ),
      ];
    }

    // --------------------------------------
    // Project connections
    // --------------------------------------

    let projectIds;

    if (body.projectIds !== undefined) {
      if (!Array.isArray(body.projectIds)) {
        return NextResponse.json(
          { message: "Invalid project selections." },
          { status: 400 }
        );
      }

      projectIds = [
        ...new Set(
          body.projectIds.filter(
            (projectId) => typeof projectId === "string"
          )
        ),
      ];
    }

    // --------------------------------------
    // Verify Vision Board ownership
    // --------------------------------------

    if (visionItemIds !== undefined) {
      const ownedItems = visionItemIds.length
        ? await prisma.visionItem.findMany({
            where: {
              id: { in: visionItemIds },
              board: { userId },
            },
            select: { id: true },
          })
        : [];

      if (ownedItems.length !== visionItemIds.length) {
        return NextResponse.json(
          {
            message:
              "One or more Vision Board items were not found.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------
    // Verify project ownership
    // --------------------------------------

    if (projectIds !== undefined) {
      const ownedProjects = projectIds.length
        ? await prisma.project.findMany({
            where: {
              id: { in: projectIds },
              userId,
            },
            select: { id: true },
          })
        : [];

      if (ownedProjects.length !== projectIds.length) {
        return NextResponse.json(
          { message: "One or more projects were not found." },
          { status: 400 }
        );
      }
    }

    // --------------------------------------
    // Update everything in one transaction
    // --------------------------------------

    const goal = await prisma.$transaction(async (tx) => {
      if (visionItemIds !== undefined) {
        await tx.visionItemGoal.deleteMany({
          where: { goalId: id },
        });

        if (visionItemIds.length) {
          await tx.visionItemGoal.createMany({
            data: visionItemIds.map((visionItemId) => ({
              goalId: id,
              visionItemId,
            })),
          });
        }
      }

      if (projectIds !== undefined) {
        await tx.projectGoal.deleteMany({
          where: { goalId: id },
        });

        if (projectIds.length) {
          await tx.projectGoal.createMany({
            data: projectIds.map((projectId) => ({
              goalId: id,
              projectId,
            })),
          });
        }
      }

      // Create or update the savings jar.
      if (nextType === "FINANCIAL") {
        await tx.financialGoal.upsert({
          where: { goalId: id },
          create: {
            goalId: id,
            ...financialGoalData,
          },
          update: financialGoalData,
        });
      }

      // Remove an empty jar when converting to a general goal.
      if (
        nextType === "GENERAL" &&
        existingGoal.financialGoal
      ) {
        await tx.financialGoal.delete({
          where: { goalId: id },
        });
      }

      return tx.goal.update({
        where: { id },
        data,
        include: goalInclude,
      });
    });

    return NextResponse.json({
      goal: formatGoal(goal),
    });
  } catch (error) {
    console.error("Goals PATCH error:", error);

    return NextResponse.json(
      { message: "Could not update your goal." },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE: Delete a goal
// ==========================================

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await prisma.goal.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "Goal not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Goals DELETE error:", error);

    return NextResponse.json(
      { message: "Could not delete your goal." },
      { status: 500 }
    );
  }
}
