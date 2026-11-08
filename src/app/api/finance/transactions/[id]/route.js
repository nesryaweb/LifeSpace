
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

const SAVING_TYPES = ["SAVING_DEPOSIT", "SAVING_WITHDRAWAL"];

function isSavingType(type) {
  return SAVING_TYPES.includes(type);
}

function toCents(value) {
  return Math.round(Number(value) * 100);
}

function signedAmount(type, amount) {
  return type === "SAVING_DEPOSIT" ? amount : -amount;
}

function validDate(value) {
  if (value === null || value === "") return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTransaction(transaction) {
  return {
    ...transaction,
    amount: Number(transaction.amount),
    financialGoal: transaction.financialGoal
      ? {
          ...transaction.financialGoal,
          targetAmount: Number(
            transaction.financialGoal.targetAmount
          ),
          goal: transaction.financialGoal.goal,
        }
      : null,
  };
}

async function getJarBalanceInCents(tx, financialGoalId, userId, excludeId) {
  const transactions = await tx.financeTransaction.findMany({
    where: {
      financialGoalId,
      userId,
      type: {
        in: SAVING_TYPES,
      },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      type: true,
      amount: true,
    },
  });

  return transactions.reduce(
    (balance, transaction) =>
      balance +
      signedAmount(
        transaction.type,
        toCents(transaction.amount)
      ),
    0
  );
}

async function getOwnedFinancialGoal(tx, financialGoalId, userId) {
  if (!financialGoalId) return null;

  return tx.financialGoal.findFirst({
    where: {
      id: financialGoalId,
      goal: {
        userId,
        type: "FINANCIAL",
      },
    },
    select: {
      id: true,
      currency: true,
    },
  });
}

// PATCH /api/finance/transactions/[id]
export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updatedTransaction = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.financeTransaction.findFirst({
          where: {
            id,
            userId: session.user.id,
          },
        });

        if (!existing) {
          throw new Error("TRANSACTION_NOT_FOUND");
        }

        const type =
          body.type !== undefined ? body.type : existing.type;

        const title =
          body.title !== undefined
            ? typeof body.title === "string"
              ? body.title.trim()
              : ""
            : existing.title;

        const description =
          body.description !== undefined
            ? typeof body.description === "string"
              ? body.description.trim()
              : null
            : existing.description;

        const category =
          body.category !== undefined
            ? typeof body.category === "string"
              ? body.category.trim()
              : null
            : existing.category;

        const amount =
          body.amount !== undefined
            ? Number(body.amount)
            : Number(existing.amount);

        const date =
          body.date !== undefined
            ? validDate(body.date)
            : existing.date;

        const financialGoalId =
          body.financialGoalId !== undefined
            ? body.financialGoalId || null
            : existing.financialGoalId;

        if (!TRANSACTION_TYPES.includes(type)) {
          throw new Error("INVALID_TYPE");
        }

        if (!title || title.length > 200) {
          throw new Error("INVALID_TITLE");
        }

        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("INVALID_AMOUNT");
        }

        if (!date) {
          throw new Error("INVALID_DATE");
        }

        if (description && description.length > 2000) {
          throw new Error("INVALID_DESCRIPTION");
        }

        if (category && category.length > 100) {
          throw new Error("INVALID_CATEGORY");
        }

        const isSaving = isSavingType(type);

        if (isSaving && !financialGoalId) {
          throw new Error("SAVINGS_GOAL_REQUIRED");
        }

        if (!isSaving && financialGoalId) {
          throw new Error("UNEXPECTED_SAVINGS_GOAL");
        }

        let currency =
          body.currency !== undefined
            ? String(body.currency).trim().toUpperCase()
            : existing.currency;

        if (!/^[A-Z]{3}$/.test(currency)) {
          throw new Error("INVALID_CURRENCY");
        }

        let financialGoal = null;

        if (isSaving) {
          financialGoal = await getOwnedFinancialGoal(
            tx,
            financialGoalId,
            session.user.id
          );

          if (!financialGoal) {
            throw new Error("FINANCIAL_GOAL_NOT_FOUND");
          }

          if (
            body.currency !== undefined &&
            currency !== financialGoal.currency
          ) {
            throw new Error("CURRENCY_MISMATCH");
          }

          currency = financialGoal.currency;
        }

        const oldWasSaving = isSavingType(existing.type);
        const oldGoalId = existing.financialGoalId;

        // Check the old jar after removing this transaction.
        if (oldWasSaving) {
          const oldJarBalance = await getJarBalanceInCents(
            tx,
            oldGoalId,
            session.user.id,
            existing.id
          );

          if (
            oldJarBalance < 0
          ) {
            throw new Error("INVALID_EXISTING_BALANCE");
          }
        }

        // Check the destination jar after applying the edited transaction.
        if (isSaving) {
          const destinationBalance = await getJarBalanceInCents(
            tx,
            financialGoalId,
            session.user.id,
            existing.id
          );

          const resultingBalance =
            destinationBalance + signedAmount(type, toCents(amount));

          if (resultingBalance < 0) {
            throw new Error("INSUFFICIENT_SAVINGS");
          }
        }

        return tx.financeTransaction.update({
          where: { id: existing.id },
          data: {
            type,
            title,
            description: description || null,
            amount,
            currency,
            category: category || null,
            date,
            financialGoalId: isSaving ? financialGoalId : null,
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
      }
    );

    return NextResponse.json({
      transaction: formatTransaction(updatedTransaction),
    });
  } catch (error) {
    const errors = {
      TRANSACTION_NOT_FOUND: [
        "Transaction not found.",
        404,
      ],
      INVALID_TYPE: ["Choose a valid transaction type.", 400],
      INVALID_TITLE: ["Enter a title of up to 200 characters.", 400],
      INVALID_AMOUNT: ["Amount must be greater than zero.", 400],
      INVALID_DATE: ["Enter a valid transaction date.", 400],
      INVALID_DESCRIPTION: ["Description must be 2,000 characters or fewer.", 400],
      INVALID_CATEGORY: ["Category must be 100 characters or fewer.", 400],
      INVALID_CURRENCY: ["Enter a valid three-letter currency code.", 400],
      SAVINGS_GOAL_REQUIRED: ["Select a savings goal for this transaction.", 400],
      UNEXPECTED_SAVINGS_GOAL: [
        "Income and expense transactions cannot be linked to a savings jar.",
        400,
      ],
      FINANCIAL_GOAL_NOT_FOUND: ["The selected financial goal was not found.", 404],
      CURRENCY_MISMATCH: [
        "The transaction currency must match the savings goal currency.",
        400,
      ],
      INSUFFICIENT_SAVINGS: [
        "This change would make the savings jar balance negative.",
        400,
      ],
      INVALID_EXISTING_BALANCE: [
        "This savings jar already has an invalid balance. Review its transactions first.",
        400,
      ],
    };

    if (errors[error.message]) {
      const [message, status] = errors[error.message];

      return NextResponse.json({ error: message }, { status });
    }

    console.error("PATCH finance transaction error:", error);

    return NextResponse.json(
      { error: "Unable to update the transaction." },
      { status: 500 }
    );
  }
}

// DELETE /api/finance/transactions/[id]
export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.financeTransaction.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

      if (!existing) {
        throw new Error("TRANSACTION_NOT_FOUND");
      }

      if (isSavingType(existing.type)) {
        const balanceAfterDeletion = await getJarBalanceInCents(
          tx,
          existing.financialGoalId,
          session.user.id,
          existing.id
        );

        if (balanceAfterDeletion < 0) {
          throw new Error("INVALID_EXISTING_BALANCE");
        }
      }

      await tx.financeTransaction.delete({
        where: { id: existing.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    if (error.message === "TRANSACTION_NOT_FOUND") {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    if (error.message === "INVALID_EXISTING_BALANCE") {
      return NextResponse.json(
        {
          error:
            "Deleting this transaction would make the savings jar balance negative.",
        },
        { status: 400 }
      );
    }

    console.error("DELETE finance transaction error:", error);

    return NextResponse.json(
      { error: "Unable to delete the transaction." },
      { status: 500 }
    );
  }
}
