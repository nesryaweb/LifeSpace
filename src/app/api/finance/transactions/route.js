
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const TRANSACTION_TYPES = [
  "INCOME",
  "EXPENSE",
  "SAVING_DEPOSIT",
  "SAVING_WITHDRAWAL",
];

function formatTransaction(transaction) {
  return {
    ...transaction,
    amount: Number(transaction.amount),
    financialGoal: transaction.financialGoal
      ? {
          ...transaction.financialGoal,
          targetAmount: Number(transaction.financialGoal.targetAmount),
          goal: transaction.financialGoal.goal,
        }
      : null,
  };
}

function validDate(value) {
  if (!value) return new Date();

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

// GET /api/finance/transactions
export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const financialGoalId = searchParams.get("financialGoalId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (type && !TRANSACTION_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type." },
        { status: 400 }
      );
    }

    const dateFilter = {};

    if (from) {
      const fromDate = new Date(from);

      if (Number.isNaN(fromDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date." },
          { status: 400 }
        );
      }

      dateFilter.gte = fromDate;
    }

    if (to) {
      const toDate = new Date(to);

      if (Number.isNaN(toDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date." },
          { status: 400 }
        );
      }

      dateFilter.lte = toDate;
    }

    const transactions = await prisma.financeTransaction.findMany({
      where: {
        userId: session.user.id,
        ...(type ? { type } : {}),
        ...(financialGoalId ? { financialGoalId } : {}),
        ...(from || to ? { date: dateFilter } : {}),
      },
      include: {
        financialGoal: {
          select: {
            id: true,
            targetAmount: true,
            currency: true,
            goal: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      transactions: transactions.map(formatTransaction),
    });
  } catch (error) {
    console.error("GET finance transactions error:", error);

    return NextResponse.json(
      { error: "Unable to load transactions." },
      { status: 500 }
    );
  }
}

// POST /api/finance/transactions
export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const type = body.type;
    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;
    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : null;
    const financialGoalId = body.financialGoalId || null;

    const amount = Number(body.amount);
    const date = validDate(body.date);

    if (!TRANSACTION_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Choose a valid transaction type." },
        { status: 400 }
      );
    }

    if (!title || title.length > 200) {
      return NextResponse.json(
        { error: "Enter a title of up to 200 characters." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: "Enter a valid transaction date." },
        { status: 400 }
      );
    }

    if (description && description.length > 2000) {
      return NextResponse.json(
        { error: "Description must be 2,000 characters or fewer." },
        { status: 400 }
      );
    }

    if (category && category.length > 100) {
      return NextResponse.json(
        { error: "Category must be 100 characters or fewer." },
        { status: 400 }
      );
    }

    const isSavingTransaction =
      type === "SAVING_DEPOSIT" ||
      type === "SAVING_WITHDRAWAL";

    if (isSavingTransaction && !financialGoalId) {
      return NextResponse.json(
        { error: "Select a savings goal for this transaction." },
        { status: 400 }
      );
    }

    if (!isSavingTransaction && financialGoalId) {
      return NextResponse.json(
        {
          error:
            "Income and expense transactions cannot be linked to a savings jar.",
        },
        { status: 400 }
      );
    }

    const transaction = await prisma.$transaction(async (tx) => {
      let currency = (
        typeof body.currency === "string" && body.currency.trim()
          ? body.currency.trim()
          : "ETB"
      ).toUpperCase();

      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new Error("INVALID_CURRENCY");
      }

      if (isSavingTransaction) {
        const financialGoal = await tx.financialGoal.findFirst({
          where: {
            id: financialGoalId,
            goal: {
              userId: session.user.id,
              type: "FINANCIAL",
            },
          },
          select: {
            id: true,
            currency: true,
          },
        });

        if (!financialGoal) {
          throw new Error("FINANCIAL_GOAL_NOT_FOUND");
        }

        if (body.currency && currency !== financialGoal.currency) {
          throw new Error("CURRENCY_MISMATCH");
        }

        currency = financialGoal.currency;

        if (type === "SAVING_WITHDRAWAL") {
          const totals = await tx.financeTransaction.aggregate({
            where: {
              financialGoalId,
              userId: session.user.id,
              type: {
                in: ["SAVING_DEPOSIT", "SAVING_WITHDRAWAL"],
              },
            },
            _sum: {
              amount: true,
            },
          });

          const currentBalance =
            Number(totals._sum.amount || 0);

          // Deposits add to the jar; withdrawals subtract from it.
          const signedBalance = await tx.financeTransaction.findMany({
            where: {
              financialGoalId,
              userId: session.user.id,
              type: {
                in: ["SAVING_DEPOSIT", "SAVING_WITHDRAWAL"],
              },
            },
            select: {
              type: true,
              amount: true,
            },
          });

          const actualBalance = signedBalance.reduce(
            (balance, item) =>
              balance +
              (item.type === "SAVING_DEPOSIT"
                ? Number(item.amount)
                : -Number(item.amount)),
            0
          );

          if (amount > actualBalance) {
            throw new Error("INSUFFICIENT_SAVINGS");
          }
        }
      }

      return tx.financeTransaction.create({
        data: {
          userId: session.user.id,
          financialGoalId: isSavingTransaction
            ? financialGoalId
            : null,
          type,
          title,
          description: description || null,
          amount,
          currency,
          category: category || null,
          date,
        },
        include: {
          financialGoal: {
            select: {
              id: true,
              targetAmount: true,
              currency: true,
              goal: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(
      { transaction: formatTransaction(transaction) },
      { status: 201 }
    );
  } catch (error) {
    if (error.message === "INVALID_CURRENCY") {
      return NextResponse.json(
        { error: "Enter a valid three-letter currency code." },
        { status: 400 }
      );
    }

    if (error.message === "FINANCIAL_GOAL_NOT_FOUND") {
      return NextResponse.json(
        { error: "The selected financial goal was not found." },
        { status: 404 }
      );
    }

    if (error.message === "CURRENCY_MISMATCH") {
      return NextResponse.json(
        { error: "The transaction currency must match the savings goal currency." },
        { status: 400 }
      );
    }

    if (error.message === "INSUFFICIENT_SAVINGS") {
      return NextResponse.json(
        { error: "You cannot withdraw more than the current jar balance." },
        { status: 400 }
      );
    }

    console.error("POST finance transaction error:", error);

    return NextResponse.json(
      { error: "Unable to save the transaction." },
      { status: 500 }
    );
  }
}
