"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Target,
  CalendarDays,
  FolderKanban,
  Image as ImageIcon,
  Clock3,
  Pause,
  Play,
  Check,
  LoaderCircle,
  AlertCircle,
  Flag,
  ExternalLink,
  Sparkles,
  ListTodo,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Coins,
  Wallet,
} from "lucide-react";
import SavingsJar from "@/components/SavingsJar";

const statusStyles = {
  ACTIVE: {
    label: "In progress",
    color: "bg-[#E6F3E9] text-[#477B57]",
    dot: "bg-[#75A981]",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-[#E8E5F7] text-[#7163A5]",
    dot: "bg-[#9688C7]",
  },
  PAUSED: {
    label: "Paused",
    color: "bg-[#F8EED9] text-[#98783C]",
    dot: "bg-[#C5A45F]",
  },
};

function formatDate(date) {
  if (!date) return "No target date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "No target date";

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(amount, currency = "ETB") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function getProjectTasks(projectLink) {
  return projectLink.project?.tasks || [];
}

function ProjectProgress({ projectLink }) {
  const project = projectLink.project;
  const tasks = getProjectTasks(projectLink);
  const completed = tasks.filter((task) => task.status === "DONE").length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-[#ECE5E8] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF1F7] text-[#7B8DAA]">
            <FolderKanban size={18} />
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[#57464F]">
              {project.title}
            </h3>
            <p className="mt-1 text-[11px] capitalize text-[#A09399]">
              {project.status.replaceAll("_", " ").toLowerCase()}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#F5F1F4] px-2.5 py-1 text-[11px] font-semibold text-[#887286]">
          {progress}%
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EEE9EC]">
        <div
          className="h-full rounded-full bg-[#9AAAC5] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#A0949A]">
        <span>
          {completed} of {tasks.length} tasks completed
        </span>
        {tasks.length === 0 && <span>No tasks yet</span>}
      </div>

      <Link
        href={`/projects/${project.id}`}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A789B] transition hover:text-[#675779]"
      >
        Open project <ExternalLink size={12} />
      </Link>
    </div>
  );
}

export default function GoalDetailPage() {
  const params = useParams();
  const goalId = params.id;

  const [goal, setGoal] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState("SAVING_DEPOSIT");
  const [transactionTitle, setTransactionTitle] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [transactionDescription, setTransactionDescription] = useState("");
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState("");

  const loadGoal = useCallback(async () => {
    if (!goalId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/goals", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not load this goal.");
      }

      const found = (data.goals || []).find(
        (item) => item.id === goalId
      );

      if (!found) {
        throw new Error("This goal could not be found.");
      }

      setGoal(found);

      if (found.financialGoal?.id) {
        const transactionResponse = await fetch(
          `/api/finance/transactions?financialGoalId=${encodeURIComponent(
            found.financialGoal.id
          )}`,
          { cache: "no-store" }
        );

        const transactionData = await transactionResponse.json();

        if (transactionResponse.ok) {
          setTransactions(transactionData.transactions || []);
        } else {
          setTransactions(found.financialGoal.transactions || []);
        }
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  const projectTasks = useMemo(() => {
    if (!goal?.projectLinks) return [];

    return goal.projectLinks.flatMap((link) =>
      getProjectTasks(link)
    );
  }, [goal]);

  const completedTasks = projectTasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const inProgressTasks = projectTasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const remainingTasks = projectTasks.filter(
    (task) => task.status === "TODO"
  ).length;

  const progress = goal?.progress || 0;
  const status = goal ? statusStyles[goal.status] : null;
  const isFinancialGoal =
    goal?.type === "FINANCIAL" || Boolean(goal?.financialGoal);

  async function changeStatus(nextStatus) {
    if (!goal || updating) return;

    setUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not update goal.");
      }

      await loadGoal();
    } catch (err) {
      setError(err.message || "Could not update goal.");
    } finally {
      setUpdating(false);
    }
  }

  function openSavingsForm(type) {
    setTransactionType(type);
    setTransactionTitle("");
    setTransactionAmount("");
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setTransactionDescription("");
    setTransactionError("");
    setShowTransactionForm(true);
  }

  async function handleSavingsTransaction(event) {
    event.preventDefault();
    setTransactionError("");

    if (!transactionTitle.trim()) {
      setTransactionError("Please enter a transaction title.");
      return;
    }

    if (!transactionAmount || Number(transactionAmount) <= 0) {
      setTransactionError("Please enter an amount greater than zero.");
      return;
    }

    if (!goal?.financialGoal?.id) {
      setTransactionError("This goal does not have a savings jar.");
      return;
    }

    setSavingTransaction(true);

    try {
      const response = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: transactionType,
          title: transactionTitle.trim(),
          amount: Number(transactionAmount),
          date: transactionDate,
          description: transactionDescription.trim() || undefined,
          financialGoalId: goal.financialGoal.id,
          currency: goal.financialGoal.currency || "ETB",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not save this transaction."
        );
      }

      setShowTransactionForm(false);
      await loadGoal();
    } catch (err) {
      setTransactionError(
        err.message || "Could not save this transaction."
      );
    } finally {
      setSavingTransaction(false);
    }
  }

  if (loading) {
    return (
      < className="flex min-h-screen items-center justify-center bg-[#FAF7F6]">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle size={28} className="animate-spin text-[#B77E99]" />
          <p className="text-xs text-[#998B91]">Opening your goal...</p>
        </div>
      </main>
    );
  }

  if (!goal) {
    return (
      < className="flex min-h-screen items-center justify-center bg-[#FAF7F6] px-5">
        <div className="max-w-md rounded-2xl border border-[#ECE3E7] bg-white p-8 text-center">
          <AlertCircle size={28} className="mx-auto mb-3 text-[#B77E99]" />
          <h1 className="text-lg font-semibold text-[#55434C]">
            Couldn't open this goal
          </h1>
          <p className="mt-2 text-sm text-[#998B91]">
            {error || "This goal may have been deleted."}
          </p>
          <Link
            href="/goals"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B77E99] px-4 py-2.5 text-xs font-semibold text-white"
          >
            <ArrowLeft size={14} /> Back to goals
          </Link>
        </div>
      </main>
    );
  }

  const financialGoal = goal.financialGoal;
  const currency = financialGoal?.currency || "ETB";
  const currentAmount = Number(financialGoal?.currentAmount || 0);
  const targetAmount = Number(financialGoal?.targetAmount || 0);
  const remainingAmount = Math.max(0, targetAmount - currentAmount);
  const savingsProgress =
    financialGoal?.progress ??
    (targetAmount > 0
      ? Math.min(100, (currentAmount / targetAmount) * 100)
      : 0);

  return (
    < className="min-h-screen bg-[#FAF7F6] px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1200px]">
        <Link
          href="/goals"
          className="mb-7 inline-flex items-center gap-2 text-xs font-medium text-[#998991] transition hover:text-[#B47C96]"
        >
          <ArrowLeft size={15} />
          All goals
        </Link>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#F0D5D1] bg-[#FFF1EF] px-4 py-3 text-sm text-[#AD5D55]">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Goal heading */}
        <section className="relative mb-7 overflow-hidden rounded-[26px] border border-[#EBDDE4] bg-gradient-to-br from-[#F9EDF2] via-[#F8F0F2] to-[#F0EDF6] p-6 sm:p-8">
          <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-white/30" />
          <div className="absolute -bottom-20 right-36 h-48 w-48 rounded-full bg-[#E8D7E7]/30" />

          <div className="relative">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${status?.color || ""}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${status?.dot || ""}`} />
                {status?.label || goal.status}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] text-[#927D89]">
                <CalendarDays size={12} />
                {formatDate(goal.targetDate)}
              </span>

              {isFinancialGoal && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#96749A]">
                  <Coins size={12} />
                  Financial goal
                </span>
              )}
            </div>

            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2 text-[#B47C96]">
                <Target size={17} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  Your goal
                </span>
              </div>

              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#4A3942] sm:text-4xl">
                {goal.title}
              </h1>

              {goal.description && (
                <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-[#897781]">
                  {goal.description}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {goal.status === "ACTIVE" && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => changeStatus("PAUSED")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 text-xs font-semibold text-[#826D78] transition hover:bg-white disabled:opacity-50"
                >
                  <Pause size={14} /> Pause goal
                </button>
              )}

              {goal.status === "PAUSED" && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => changeStatus("ACTIVE")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 text-xs font-semibold text-[#826D78] transition hover:bg-white disabled:opacity-50"
                >
                  <Play size={14} /> Resume goal
                </button>
              )}

              {goal.status !== "COMPLETED" && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => changeStatus("COMPLETED")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#A17E9A] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#8D6A86] disabled:opacity-50"
                >
                  {updating ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Mark completed
                </button>
              )}

              {goal.status === "COMPLETED" && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => changeStatus("ACTIVE")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#A17E9A] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#8D6A86] disabled:opacity-50"
                >
                  <Play size={14} /> Reopen goal
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Financial goal layout */}
        {isFinancialGoal ? (
          <>
            <section className="mb-7 grid items-start gap-6 lg:grid-cols-[minmax(320px,0.9fr)_1.1fr]">
              <SavingsJar
                title={goal.title}
                currentAmount={currentAmount}
                targetAmount={targetAmount}
                currency={currency}
                progress={savingsProgress}
              />

              <div className="space-y-5">
                <div className="rounded-[22px] border border-[#EAE2E5] bg-white p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <Wallet size={17} className="text-[#B47C96]" />
                    <h2 className="text-sm font-semibold text-[#5B4852]">
                      Your savings at a glance
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#F7EFF5] p-4">
                      <p className="text-[11px] text-[#A18F9D]">Saved so far</p>
                      <p className="mt-2 break-words text-xl font-semibold text-[#765D78]">
                        {formatMoney(currentAmount, currency)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F0F4EF] p-4">
                      <p className="text-[11px] text-[#91A091]">Still to save</p>
                      <p className="mt-2 break-words text-xl font-semibold text-[#66806A]">
                        {formatMoney(remainingAmount, currency)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F4F1F8] p-4">
                      <p className="text-[11px] text-[#A097B1]">Target amount</p>
                      <p className="mt-2 break-words text-lg font-semibold text-[#756A91]">
                        {formatMoney(targetAmount, currency)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#FBF5EA] p-4">
                      <p className="text-[11px] text-[#B2A17E]">Progress</p>
                      <p className="mt-2 text-xl font-semibold text-[#9A8154]">
                        {Math.round(savingsProgress)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openSavingsForm("SAVING_DEPOSIT")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9B83A5] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#856D90]"
                    >
                      <ArrowDownToLine size={15} />
                      Add savings
                    </button>

                    <button
                      type="button"
                      onClick={() => openSavingsForm("SAVING_WITHDRAWAL")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8DCE7] bg-white px-4 py-3 text-xs font-semibold text-[#8C718E] transition hover:bg-[#FBF6FA]"
                    >
                      <ArrowUpFromLine size={15} />
                      Withdraw savings
                    </button>
                  </div>

                  <p className="mt-4 text-[11px] leading-relaxed text-[#A1949A]">
                    Deposits add money to this jar. Withdrawals remove money
                    from it and return that amount to your available balance.
                  </p>
                </div>

                <div className="rounded-[22px] border border-[#EAE2E5] bg-white p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Clock3 size={16} className="text-[#B47C96]" />
                    <h2 className="text-sm font-semibold text-[#5B4852]">
                      Financial goal details
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-[#A1949A]">Target date</span>
                      <span className="text-right text-xs font-semibold text-[#69555F]">
                        {formatDate(goal.targetDate)}
                      </span>
                    </div>
                    <div className="h-px bg-[#F1EAEC]" />
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-[#A1949A]">Created</span>
                      <span className="text-right text-xs font-semibold text-[#69555F]">
                        {formatDate(goal.createdAt)}
                      </span>
                    </div>
                    <div className="h-px bg-[#F1EAEC]" />
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-[#A1949A]">Currency</span>
                      <span className="text-xs font-semibold text-[#69555F]">
                        {currency}
                      </span>
                    </div>
                    <div className="h-px bg-[#F1EAEC]" />
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-[#A1949A]">Vision items</span>
                      <span className="text-xs font-semibold text-[#69555F]">
                        {goal.visionItems?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Transactions for this jar */}
            <section className="mb-7 rounded-[22px] border border-[#EAE2E5] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1EAEC] p-5 sm:p-6">
                <div>
                  <h2 className="text-sm font-semibold text-[#5B4852]">
                    This jar's activity
                  </h2>
                  <p className="mt-1 text-xs text-[#A1949A]">
                    Deposits and withdrawals connected to this financial goal.
                  </p>
                </div>
                <span className="rounded-full bg-[#F7EFF5] px-3 py-1.5 text-[11px] font-semibold text-[#967A96]">
                  {transactions.length} transactions
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Coins size={27} className="mx-auto text-[#B99DB8]" />
                  <p className="mt-3 text-sm font-semibold text-[#715B66]">
                    Your jar is waiting for its first contribution
                  </p>
                  <p className="mt-1 text-xs text-[#A1949A]">
                    Add savings to see your activity here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#F4EBF0]">
                  {transactions.map((transaction) => {
                    const isDeposit =
                      transaction.type === "SAVING_DEPOSIT";

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="rounded-xl bg-[#F7F1F6] p-3 text-[#927A99]">
                            {isDeposit ? (
                              <ArrowDownToLine size={17} />
                            ) : (
                              <ArrowUpFromLine size={17} />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#554653]">
                              {transaction.title}
                            </p>
                            <p className="mt-1 text-xs text-[#A18F9D]">
                              {isDeposit ? "Deposit" : "Withdrawal"}
                              {" · "}
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                            {transaction.description && (
                              <p className="mt-1 truncate text-[11px] text-[#A99BA4]">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <p
                          className={`shrink-0 text-sm font-semibold ${
                            isDeposit
                              ? "text-emerald-600"
                              : "text-rose-500"
                          }`}
                        >
                          {isDeposit ? "+" : "-"}
                          {formatMoney(transaction.amount, currency)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {/* General goal progress */}
            <section className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-[22px] border border-[#EAE2E5] bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#AD8A9C]">
                      Goal progress
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[#55434C]">
                      You're moving forward
                    </h2>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8EDF2] text-[#B47C96]">
                    <Flag size={20} />
                  </span>
                </div>

                <div className="mb-3 flex items-end justify-between">
                  <span className="text-4xl font-semibold tabular-nums text-[#705665]">
                    {progress}%
                  </span>
                  <span className="pb-1 text-xs text-[#A1949A]">
                    Based on linked project tasks
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[#F0E9EC]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#D99BB2] to-[#A982A6] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#F0F5F0] p-3">
                    <p className="text-xl font-semibold text-[#62836A]">
                      {completedTasks}
                    </p>
                    <p className="mt-1 text-[10px] text-[#8B9E8F]">
                      Completed
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F2F1F8] p-3">
                    <p className="text-xl font-semibold text-[#7C73A4]">
                      {inProgressTasks}
                    </p>
                    <p className="mt-1 text-[10px] text-[#9B95B5]">
                      In progress
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F8F2E8] p-3">
                    <p className="text-xl font-semibold text-[#A28A5D]">
                      {remainingTasks}
                    </p>
                    <p className="mt-1 text-[10px] text-[#AA9B7D]">
                      To do
                    </p>
                  </div>
                </div>

                {!projectTasks.length && (
                  <p className="mt-4 rounded-xl bg-[#FAF6F7] p-3 text-xs leading-relaxed text-[#A09298]">
                    This goal doesn't have any linked project tasks yet.
                    Connect a project and add tasks to start tracking progress.
                  </p>
                )}
              </div>

              <div className="rounded-[22px] border border-[#EAE2E5] bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Clock3 size={16} className="text-[#B47C96]" />
                  <h2 className="text-sm font-semibold text-[#5B4852]">
                    Goal details
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-[#A1949A]">Target date</span>
                    <span className="text-right text-xs font-semibold text-[#69555F]">
                      {formatDate(goal.targetDate)}
                    </span>
                  </div>
                  <div className="h-px bg-[#F1EAEC]" />
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-[#A1949A]">Created</span>
                    <span className="text-right text-xs font-semibold text-[#69555F]">
                      {formatDate(goal.createdAt)}
                    </span>
                  </div>
                  <div className="h-px bg-[#F1EAEC]" />
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-[#A1949A]">Connected projects</span>
                    <span className="text-xs font-semibold text-[#69555F]">
                      {goal.projects?.length || 0}
                    </span>
                  </div>
                  <div className="h-px bg-[#F1EAEC]" />
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-[#A1949A]">Vision items</span>
                    <span className="text-xs font-semibold text-[#69555F]">
                      {goal.visionItems?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Vision items for both goal types */}
        <section className="mb-7">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[#B47C96]">
                <ImageIcon size={15} />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                  The inspiration
                </span>
              </div>
              <h2 className="text-xl font-semibold text-[#55434C]">
                Your vision
              </h2>
              <p className="mt-1 text-xs text-[#A1949A]">
                The images and ideas connected to this goal.
              </p>
            </div>
            <Link
              href="/vision"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#A77D96] hover:text-[#855B74]"
            >
              Open vision board <ChevronRight size={14} />
            </Link>
          </div>

          {goal.visionItems?.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {goal.visionItems.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[#EAE2E5] bg-white p-2.5"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title || "Vision Board item"}
                      className="h-36 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center rounded-xl bg-[#F8EEF3] p-4 text-center">
                      <Sparkles size={25} className="text-[#B77E99]" />
                    </div>
                  )}

                  {item.title && (
                    <p className="mt-2 truncate px-1 text-xs font-semibold text-[#68545E]">
                      {item.title}
                    </p>
                  )}

                  {item.description && (
                    <p className="mt-1 line-clamp-2 px-1 text-[10px] leading-relaxed text-[#A09298]">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E5D6DD] bg-white/70 p-8 text-center">
              <ImageIcon size={25} className="mx-auto mb-2 text-[#C3A4B4]" />
              <p className="text-sm font-semibold text-[#715B66]">
                No vision items linked yet
              </p>
              <p className="mt-1 text-xs text-[#A1949A]">
                Connect inspiration from your Vision Board to this goal.
              </p>
              <Link
                href="/vision"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#A77D96]"
              >
                Visit Vision Board <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </section>

        {/* Projects are only part of general goals */}
        {!isFinancialGoal && (
          <>
            <section className="mb-8">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-[#8798B4]">
                    <FolderKanban size={15} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                      The action plan
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-[#55434C]">
                    Connected projects
                  </h2>
                  <p className="mt-1 text-xs text-[#A1949A]">
                    Projects and their tasks contributing to this goal.
                  </p>
                </div>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8795AE] hover:text-[#687A98]"
                >
                  All projects <ChevronRight size={14} />
                </Link>
              </div>

              {goal.projectLinks?.length ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {goal.projectLinks.map((link) => (
                    <ProjectProgress
                      key={link.project.id}
                      projectLink={link}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#DCE2EB] bg-white/70 p-8 text-center">
                  <FolderKanban size={25} className="mx-auto mb-2 text-[#A1AEC5]" />
                  <p className="text-sm font-semibold text-[#655C72]">
                    No projects connected yet
                  </p>
                  <p className="mt-1 text-xs text-[#A1949A]">
                    Connect a project to turn this goal into actionable steps.
                  </p>
                  <Link
                    href="/projects"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#8795AE]"
                  >
                    Explore projects <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </section>

            <div className="flex items-start gap-3 rounded-2xl border border-[#EAE4E7] bg-white/70 p-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5EDF2] text-[#B47C96]">
                <ListTodo size={16} />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#69565F]">
                  Progress is connected to your work
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#9C8F95]">
                  Completing tasks in any linked project contributes to this
                  goal's progress. The same task can contribute to more than
                  one goal if its project is linked to multiple goals.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Deposit / withdrawal modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#3D3040]/35 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-[#F0E5EB] bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#554653]">
                  {transactionType === "SAVING_DEPOSIT"
                    ? "Add savings"
                    : "Withdraw savings"}
                </h2>
                <p className="mt-1 text-xs text-[#A18F9D]">
                  {goal.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTransactionForm(false)}
                className="rounded-xl bg-[#F8F1F6] p-2 text-[#967F96] hover:bg-[#F0E5EF]"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSavingsTransaction} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#776477]">
                  Transaction title
                </label>
                <input
                  required
                  value={transactionTitle}
                  onChange={(event) =>
                    setTransactionTitle(event.target.value)
                  }
                  placeholder={
                    transactionType === "SAVING_DEPOSIT"
                      ? "e.g. Monthly savings"
                      : "e.g. Emergency withdrawal"
                  }
                  className="w-full rounded-xl border border-[#EDE2E9] bg-[#FFFCFE] px-3 py-3 text-sm text-[#554653] outline-none placeholder:text-[#C0B2BD] focus:border-[#B99AB8]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#776477]">
                    Amount ({currency})
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={transactionAmount}
                    onChange={(event) =>
                      setTransactionAmount(event.target.value)
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[#EDE2E9] bg-[#FFFCFE] px-3 py-3 text-sm text-[#554653] outline-none focus:border-[#B99AB8]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#776477]">
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    value={transactionDate}
                    onChange={(event) =>
                      setTransactionDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#EDE2E9] bg-[#FFFCFE] px-3 py-3 text-sm text-[#554653] outline-none focus:border-[#B99AB8]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#776477]">
                  Description <span className="font-normal text-[#B5A7B2]">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={transactionDescription}
                  onChange={(event) =>
                    setTransactionDescription(event.target.value)
                  }
                  placeholder="Add a note..."
                  className="w-full resize-none rounded-xl border border-[#EDE2E9] bg-[#FFFCFE] px-3 py-3 text-sm text-[#554653] outline-none placeholder:text-[#C0B2BD] focus:border-[#B99AB8]"
                />
              </div>

              {transactionError && (
                <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs text-rose-600">
                  <AlertCircle size={15} />
                  {transactionError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransactionForm(false)}
                  className="rounded-xl border border-[#EDE2E9] px-4 py-2.5 text-xs font-semibold text-[#8F7D8D] hover:bg-[#FFFAFD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTransaction}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#9B83A5] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#856D90] disabled:opacity-60"
                >
                  {savingTransaction && (
                    <LoaderCircle size={14} className="animate-spin" />
                  )}
                  Save transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}