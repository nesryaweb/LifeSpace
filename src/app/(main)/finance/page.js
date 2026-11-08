"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  LoaderCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import SavingsJar from "@/components/SavingsJar";

const TRANSACTION_TYPES = [
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
  { value: "SAVING_DEPOSIT", label: "Deposit into a jar" },
  { value: "SAVING_WITHDRAWAL", label: "Withdraw from a jar" },
];

const today = () => new Date().toISOString().slice(0, 10);

function formatMoney(amount, currency = "ETB") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    type: "EXPENSE",
    title: "",
    amount: "",
    date: today(),
    description: "",
    financialGoalId: "",
  });

  const loadFinanceData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [transactionResponse, goalResponse] = await Promise.all([
        fetch("/api/finance/transactions", { cache: "no-store" }),
        fetch("/api/goals", { cache: "no-store" }),
      ]);

      const [transactionData, goalData] = await Promise.all([
        transactionResponse.json(),
        goalResponse.json(),
      ]);

      if (!transactionResponse.ok) {
        throw new Error(
          transactionData.error || "Unable to load transactions."
        );
      }

      if (!goalResponse.ok) {
        throw new Error(goalData.error || "Unable to load financial goals.")
      }

      setTransactions(transactionData.transactions || []);
      setGoals(goalData.goals || []);
    } catch (err) {
      setError(err.message || "Unable to load your finance information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const financialGoals = useMemo(
    () =>
      goals.filter(
        (goal) =>
          goal.type === "FINANCIAL" &&
          goal.status === "ACTIVE" &&
          goal.financialGoal
      ),
    [goals]
  );

  const income = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expenses = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const savingsDeposits = transactions
    .filter((item) => item.type === "SAVING_DEPOSIT")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const savingsWithdrawals = transactions
    .filter((item) => item.type === "SAVING_WITHDRAWAL")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const savings = savingsDeposits - savingsWithdrawals;

  const availableBalance =
    income - expenses - savingsDeposits + savingsWithdrawals;

  const summaryCards = [
    {
      title: "Total income",
      amount: income,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Total expenses",
      amount: expenses,
      icon: TrendingDown,
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
    {
      title: "Saved in jars",
      amount: savings,
      icon: PiggyBank,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Available balance",
      amount: availableBalance,
      icon: Wallet,
      color: "text-[#88718F]",
      bg: "bg-[#F5EFF7]",
    },
  ];

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Please enter a transaction title.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Please enter an amount greater than zero.");
      return;
    }

    const isSavingTransaction = [
      "SAVING_DEPOSIT",
      "SAVING_WITHDRAWAL",
    ].includes(form.type);

    if (isSavingTransaction && !form.financialGoalId) {
      setFormError("Please select the savings jar for this transaction.");
      return;
    }

    const selectedGoal = financialGoals.find(
      (goal) => goal.id === form.financialGoalId
    );

    setSaving(true);

    try {
      const response = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          amount: Number(form.amount),
          date: form.date,
          description: form.description.trim() || undefined,
          financialGoalId: isSavingTransaction
            ? form.financialGoalId
            : undefined,
          currency: selectedGoal?.financialGoal?.currency || "ETB",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not save this transaction."
        );
      }

      setShowForm(false);
      setForm({
        type: "EXPENSE",
        title: "",
        amount: "",
        date: today(),
        description: "",
        financialGoalId: "",
      });

      await loadFinanceData();
    } catch (err) {
      setFormError(err.message || "Could not save this transaction.");
    } finally {
      setSaving(false);
    }
  }

  const isSavingType = [
    "SAVING_DEPOSIT",
    "SAVING_WITHDRAWAL",
  ].includes(form.type);

  return (
    <div className="min-h-screen bg-[#FCF9FB] px-4 py-6 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#A18F9D]">
              Your money, organized
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[#554653]">
              Finance
            </h1>
            <p className="mt-2 text-sm text-[#9B8997]">
              Keep track of your income, expenses, and savings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-[#9B83A5] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#856D90]"
          >
            <Plus size={17} />
            Add transaction
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {/* Savings jars */}
        <section className="rounded-3xl border border-[#F0E5EB] bg-white p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#F5EFF7] p-3">
                <PiggyBank className="text-[#88718F]" size={22} />
              </div>
              <div>
                <h2 className="font-semibold text-[#554653]">
                  Your savings jars
                </h2>
                <p className="mt-1 text-sm text-[#A18F9D]">
                  Watch each financial goal grow, one contribution at a time.
                </p>
              </div>
            </div>

            <Link
              href="/goals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9B83A5] hover:text-[#80668B]"
            >
              View all goals <ExternalLink size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#A18F9D]">
              <LoaderCircle size={18} className="animate-spin" />
              Loading your savings jars...
            </div>
          ) : financialGoals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E8DCE5] bg-[#FFFBFD] px-6 py-12 text-center">
              <PiggyBank size={30} className="mx-auto text-[#B99DB8]" />
              <h3 className="mt-3 text-sm font-semibold text-[#66566A]">
                No active savings jars yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#A18F9D]">
                Create a financial goal from your Goals page and its savings
                jar will appear here.
              </p>
              <Link
                href="/goals"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#9B83A5] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#856D90]"
              >
                <Plus size={14} />
                Create a financial goal
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {financialGoals.map((goal) => {
                const jar = goal.financialGoal;

                return (
                  <div
                    key={goal.id}
                    className="min-w-0 rounded-2xl border border-[#F0E5EB] bg-[#FFFCFE] p-3 transition hover:border-[#DCC7D8]"
                  >
                    <SavingsJar
                      title={goal.title}
                      currentAmount={jar.currentAmount}
                      targetAmount={jar.targetAmount}
                      currency={jar.currency || "ETB"}
                      progress={jar.progress}
                      compact
                    />

                    <Link
                      href={`/goals/${goal.id}`}
                      className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#F4EAF2] px-4 py-3 text-xs font-semibold text-[#896D89] transition hover:bg-[#EEDDEB]"
                    >
                      Open financial goal
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Financial summary */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-3xl border border-[#F0E5EB] bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#9B8997]">{card.title}</p>
                  <div className={`rounded-xl p-2.5 ${card.bg}`}>
                    <Icon size={19} className={card.color} />
                  </div>
                </div>

                <p className="mt-4 text-2xl font-bold text-[#554653]">
                  {formatMoney(card.amount)}
                </p>
              </div>
            );
          })}
        </section>

        {/* Transactions */}
        <section className="rounded-3xl border border-[#F0E5EB] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F4EBF0] p-6">
            <div>
              <h2 className="font-semibold text-[#554653]">
                Recent transactions
              </h2>
              <p className="mt-1 text-sm text-[#A18F9D]">
                Your recorded financial activity
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-[#A18F9D]">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="rounded-full bg-[#F8F1F6] p-5">
                <Wallet size={28} className="text-[#A58DA9]" />
              </div>
              <h3 className="mt-4 font-semibold text-[#66566A]">
                No transactions yet
              </h3>
              <p className="mt-2 max-w-sm text-sm text-[#A18F9D]">
                Your income, expenses, and savings activity will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F4EBF0]">
              {transactions.map((transaction) => {
                const isIncome = transaction.type === "INCOME";
                const isDeposit = transaction.type === "SAVING_DEPOSIT";
                const isWithdrawal =
                  transaction.type === "SAVING_WITHDRAWAL";

                const Icon = isIncome
                  ? TrendingUp
                  : isDeposit
                    ? ArrowDownToLine
                    : isWithdrawal
                      ? ArrowUpFromLine
                      : TrendingDown;

                const isPositive = isIncome || isWithdrawal;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-[#F7F1F6] p-3">
                        <Icon size={18} className="text-[#927A99]" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#554653]">
                          {transaction.title}
                        </p>
                        <p className="mt-1 text-xs text-[#A18F9D]">
                          {transaction.category ||
                            transaction.type.replaceAll("_", " ")}
                          {" · "}
                          {new Date(transaction.date).toLocaleDateString()}
                          {transaction.financialGoal?.goal?.title
                            ? ` · ${transaction.financialGoal.goal.title}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`shrink-0 text-sm font-semibold ${
                        isPositive ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {isPositive ? "+" : "-"}
                      {formatMoney(
                        Number(transaction.amount),
                        transaction.currency || "ETB"
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Add transaction modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#3D3040]/35 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-[#F0E5EB] bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#554653]">
                  Add transaction
                </h2>
                <p className="mt-1 text-xs text-[#A18F9D]">
                  Record income, expenses, or savings activity.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl bg-[#F8F1F6] p-2 text-[#967F96] hover:bg-[#F0E5EF]"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#776477]">
                  Transaction type
                </label>
                <select
                  value={form.type}
                  onChange={(event) => {
                    updateForm("type", event.target.value);
                    updateForm("financialGoalId", "");
                  }}
                  className="w-full rounded-xl border border-[#EDE2E9] bg-[#FFFCFE] px-3 py-3 text-sm text-[#554653] outline-none focus:border-[#B99AB8]"
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {isSavingType && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#776477]">
                    Savings jar
                  </label>
                  <select
                    required
                    value={form.financialGoalId}
                    onChange={(event) =>
                      updateForm("financialGoalId", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#EDE2E9] bg-[#FFFCFE] px-3 py-3 text-sm text-[#554653] outline-none focus:border-[#B99AB8]"
                  >
                    <option value="">Choose a financial goal</option>
                    {financialGoals.map((goal) => (
                      <option key={goal.id} value={goal.financialGoal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#776477]">
                  Title
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                  placeholder={
                    form.type === "INCOME"
                      ? "e.g. Monthly salary"
                      : form.type === "EXPENSE"
                        ? "e.g. Groceries"
                        : form.type === "SAVING_DEPOSIT"
                          ? "e.g. Monthly savings"
                          : "e.g. Emergency withdrawal"
                  }
                  className="w-full rounded-xl border border-[#EDE2E9] bg-[#FFFCFE] px-3 py-3 text-sm text-[#554653] outline-none placeholder:text-[#C0B2BD] focus:border-[#B99AB8]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#776477]">
                    Amount
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      updateForm("amount", event.target.value)
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
                    value={form.date}
                    onChange={(event) =>
                      updateForm("date", event.target.value)
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
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Add a note..."
                  className="w-full resize-none rounded-xl border border-[#EDE2E9] bg-[#FFFCFE] px-3 py-3 text-sm text-[#554653] outline-none placeholder:text-[#C0B2BD] focus:border-[#B99AB8]"
                />
              </div>

              {formError && (
                <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-xs text-rose-600">
                  <AlertCircle size={15} />
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-[#EDE2E9] px-4 py-2.5 text-xs font-semibold text-[#8F7D8D] hover:bg-[#FFFAFD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#9B83A5] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#856D90] disabled:opacity-60"
                >
                  {saving && <LoaderCircle size={14} className="animate-spin" />}
                  Save transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}