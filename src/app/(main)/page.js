"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Coins,
  Compass,
  Feather,
  FolderKanban,
  GraduationCap,
  Heart,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import SavingsJar from "@/components/SavingsJar";
function dateKey(value = new Date()) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, options = {}) {
  const date = safeDate(value);
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...options,
  }).format(date);
}

function formatAmount(amount, currency = "ETB") {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency || "ETB",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency || ""}`;
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isCompleted(status) {
  return String(status || "").toUpperCase() === "COMPLETED";
}

function isOverdue(task) {
  if (isCompleted(task.status) || !task.dueDate) return false;

  const dueDate = safeDate(task.dueDate);
  return dueDate && dateKey(dueDate) < dateKey();
}

function clamp(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function SectionHeading({ eyebrow, title, description, href, icon: Icon }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B58AA6]">
            {eyebrow}
          </p>
        )}

        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-[#B58AA6]" />}
          <h2 className="text-lg font-semibold text-[#493D49]">{title}</h2>
        </div>

        {description && (
          <p className="mt-1 text-xs text-[#9B8D98]">{description}</p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#A77D9A] transition hover:text-[#805B78]"
        >
          View all <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, href, action }) {
  return (
    <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E9DDE6] bg-[#FCF9FB] px-5 py-7 text-center">
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5EAF1] text-[#B58AA6]">
          <Icon size={19} />
        </div>
      )}

      <p className="text-sm font-semibold text-[#655565]">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-[#A394A0]">
        {description}
      </p>

      {href && action && (
        <Link
          href={href}
          className="mt-3 text-xs font-semibold text-[#A77D9A] hover:underline"
        >
          {action} →
        </Link>
      )}
    </div>
  );
}

function ProgressBar({ value, color = "bg-[#C99AB6]" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#F1EAF0]">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${clamp(value)}%` }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, tone }) {
  const tones = {
    pink: "bg-[#F9EDF3] text-[#B47F9D]",
    purple: "bg-[#F0ECF8] text-[#9581B5]",
    sage: "bg-[#EDF4ED] text-[#7F9D83]",
    beige: "bg-[#F8F1E8] text-[#B49469]",
  };

  return (
    <div className="rounded-2xl border border-[#F0E7ED] bg-white p-4 shadow-[0_3px_14px_rgba(93,64,85,0.035)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#9A8C98]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#514451]">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-[#A99BA7]">{detail}</p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const completed = isCompleted(task.status);
  const overdue = isOverdue(task);

  return (
    <div className="flex items-start gap-3 border-b border-[#F4EDF2] py-3 last:border-0 last:pb-0">
      <div className="mt-0.5">
        {completed ? (
          <CheckCircle2 size={17} className="text-[#91AA91]" />
        ) : (
          <Circle size={17} className="text-[#B58AA6]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${completed ? "text-[#A99DA7] line-through" : "text-[#5A4C59]"}`}
        >
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#A99BA7]">
          {task.project?.title && <span>{task.project.title}</span>}
          {task.dueDate && (
            <>
              {task.project?.title && <span>·</span>}
              <span className={overdue ? "font-semibold text-[#C77F8D]" : ""}>
                Due {formatDate(task.dueDate)}
              </span>
            </>
          )}
        </div>
      </div>

      {task.priority && (
        <span className="shrink-0 rounded-full bg-[#F8F1F5] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#A7839B]">
          {String(task.priority).toLowerCase()}
        </span>
      )}
    </div>
  );
}

function EventRow({ event }) {
  const eventDate = safeDate(event.date);

  return (
    <div className="flex items-center gap-3 border-b border-[#F4EDF2] py-3 last:border-0 last:pb-0">
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#F6EEF4] text-[#A77D9A]">
        <span className="text-[9px] font-semibold uppercase">
          {eventDate ? formatDate(eventDate, { month: "short" }) : "—"}
        </span>
        <span className="text-base font-bold leading-4">
          {eventDate ? eventDate.getDate() : "—"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#5A4C59]">
          {event.title}
        </p>
        <p className="mt-1 text-[10px] text-[#A99BA7]">
          {event.type === "TASK"
            ? "Task"
            : event.type === "PROJECT"
              ? "Project deadline"
              : event.type === "MILESTONE"
                ? "Milestone"
                : event.type || "Event"}
          {event.project?.title ? ` · ${event.project.title}` : ""}
        </p>
      </div>

      <CalendarDays size={15} className="shrink-0 text-[#C3A5BA]" />
    </div>
  );
}

function GoalCard({ goal }) {
  const financial = goal.type === "FINANCIAL" || goal.financialGoal;
  const progress = financial ? goal.financialGoal?.progress : goal.progress;

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="block rounded-2xl border border-[#F0E7ED] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(93,64,85,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#5A4C59]">
            {goal.title}
          </p>
          <p className="mt-1 text-[10px] text-[#A99BA7]">
            {financial ? "Financial goal" : "Personal goal"}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[#F5EEF4] px-2 py-1 text-[9px] font-semibold text-[#A7839B]">
          {Math.round(clamp(progress))}%
        </span>
      </div>

      <div className="mt-4">
        <ProgressBar
          value={progress}
          color={financial ? "bg-[#A99BC8]" : "bg-[#C99AB6]"}
        />
      </div>

      {financial && goal.financialGoal && (
        <div className="mt-2 flex justify-between gap-2 text-[10px] text-[#9D8E9A]">
          <span>
            {formatAmount(
              goal.financialGoal.currentAmount,
              goal.financialGoal.currency,
            )}
          </span>
          <span>
            of{" "}
            {formatAmount(
              goal.financialGoal.targetAmount,
              goal.financialGoal.currency,
            )}
          </span>
        </div>
      )}

      {!financial && goal.targetDate && (
        <p className="mt-2 text-[10px] text-[#A99BA7]">
          Target: {formatDate(goal.targetDate)}
        </p>
      )}
    </Link>
  );
}

function LearningCard({ path }) {
  return (
    <Link
      href={`/learning/${path.id}`}
      className="block rounded-2xl border border-[#F0E7ED] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(93,64,85,0.07)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#5A4C59]">
            {path.title}
          </p>
          <p className="mt-1 text-[10px] text-[#A99BA7]">
            {path.completedLessons || 0} of {path.totalLessons || 0} lessons
            completed
          </p>
        </div>
        <span className="text-xs font-semibold text-[#9581B5]">
          {Math.round(clamp(path.progress))}%
        </span>
      </div>

      <div className="mt-3">
        <ProgressBar value={path.progress} color="bg-[#A99BC8]" />
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [data, setData] = useState({
    tasks: [],
    events: [],
    goals: [],
    transactions: [],
    projects: [],
    learning: [],
    journal: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const today = new Date();
  const todayKey = dateKey(today);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    const from = new Date();
    from.setHours(0, 0, 0, 0);

    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    to.setHours(23, 59, 59, 999);

    try {
      const responses = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch(
          `/api/calendar?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
          { cache: "no-store" },
        ),
        fetch("/api/goals", { cache: "no-store" }),
        fetch("/api/finance/transactions", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/learning", { cache: "no-store" }),
        fetch("/api/journal", { cache: "no-store" }),
      ]);

      const failed = responses.find((response) => !response.ok);
      if (failed) {
        throw new Error(
          `A dashboard section could not be loaded (${failed.status}).`,
        );
      }

      const [
        tasksData,
        calendarData,
        goalsData,
        financeData,
        projectsData,
        learningData,
        journalData,
      ] = await Promise.all(responses.map((response) => response.json()));

      setData({
        tasks: Array.isArray(tasksData) ? tasksData : [],
        events: Array.isArray(calendarData?.events) ? calendarData.events : [],
        goals: Array.isArray(goalsData?.goals) ? goalsData.goals : [],
        transactions: Array.isArray(financeData?.transactions)
          ? financeData.transactions
          : [],
        projects: Array.isArray(projectsData?.projects)
          ? projectsData.projects
          : [],
        learning: Array.isArray(learningData) ? learningData : [],
        journal: Array.isArray(journalData) ? journalData : [],
      });
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err.message || "Something went wrong while loading your home page.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const { tasks, events, goals, transactions, projects, learning, journal } =
    data;

  const taskStats = useMemo(() => {
    const completed = tasks.filter((task) => isCompleted(task.status));
    const overdue = tasks.filter(isOverdue);
    const active = tasks.filter((task) => !isCompleted(task.status));

    return {
      total: tasks.length,
      completed: completed.length,
      overdue,
      active,
      completionRate: tasks.length
        ? Math.round((completed.length / tasks.length) * 100)
        : 0,
    };
  }, [tasks]);

  const todayTasks = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate && dateKey(task.dueDate) === todayKey)
      .sort(
        (a, b) => Number(isCompleted(a.status)) - Number(isCompleted(b.status)),
      );
  }, [tasks, todayKey]);

  const todayEvents = useMemo(() => {
    return events.filter(
      (event) => event.date && dateKey(event.date) === todayKey,
    );
  }, [events, todayKey]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => {
        const eventDate = safeDate(event.date);
        return eventDate && dateKey(eventDate) >= todayKey;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 6);
  }, [events, todayKey]);

  const activeGoals = useMemo(() => {
    return goals
      .filter(
        (goal) => String(goal.status || "ACTIVE").toUpperCase() === "ACTIVE",
      )
      .slice(0, 4);
  }, [goals]);

  const activeProjects = useMemo(() => {
    return projects
      .filter(
        (project) =>
          String(project.status || "ACTIVE").toUpperCase() !== "COMPLETED",
      )
      .slice(0, 4);
  }, [projects]);

  const activeLearning = useMemo(() => {
    return learning
      .filter(
        (path) => String(path.status || "ACTIVE").toUpperCase() !== "COMPLETED",
      )
      .slice(0, 3);
  }, [learning]);

  const financialGoals = useMemo(
    () => goals.filter((goal) => goal.financialGoal),
    [goals],
  );

  const financeSummary = useMemo(() => {
    const totals = {};

    transactions.forEach((transaction) => {
      const currency = transaction.currency || "ETB";

      if (!totals[currency]) {
        totals[currency] = { income: 0, expenses: 0, savings: 0 };
      }

      const amount = Number(transaction.amount || 0);

      if (transaction.type === "INCOME") totals[currency].income += amount;
      if (transaction.type === "EXPENSE") totals[currency].expenses += amount;
      if (transaction.type === "SAVING_DEPOSIT")
        totals[currency].savings += amount;
      if (transaction.type === "SAVING_WITHDRAWAL")
        totals[currency].savings -= amount;
    });

    return Object.entries(totals);
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [transactions]);

  const recentJournal = useMemo(() => {
    return [...journal]
      .sort(
        (a, b) =>
          new Date(b.entryDate || b.createdAt) -
          new Date(a.entryDate || a.createdAt),
      )
      .slice(0, 3);
  }, [journal]);

  if (loading) {
    return (
      < className="min-h-screen bg-[#FBF8FA] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5EAF1] text-[#B58AA6]">
            <LoaderCircle size={25} className="animate-spin" />
          </div>
          <p className="text-sm font-semibold text-[#655565]">
            Preparing your space...
          </p>
          <p className="mt-1 text-xs text-[#A99BA7]">
            Gathering everything in one place.
          </p>
        </div>
      </main>
    );
  }

  return (
    < className="min-h-screen bg-[#FBF8FA] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#B58AA6]">
              YOUR PERSONAL SPACE
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#493D49] sm:text-3xl">
              {getGreeting()} <span className="text-[#C18EAB]">♡</span>
            </h1>
            <p className="mt-1 text-sm text-[#9B8D98]">
              {new Intl.DateTimeFormat("en", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }).format(today)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-[#EDE2EA] bg-white px-3 py-2 text-xs font-semibold text-[#8F778A] shadow-sm transition hover:bg-[#FCF7FA] disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F0D9DE] bg-[#FFF6F7] px-4 py-3">
            <p className="text-xs text-[#A96F7B]">{error}</p>
            <button
              type="button"
              onClick={() => loadDashboard()}
              className="text-xs font-semibold text-[#A96F7B] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* WELCOME */}
        <section className="relative mb-7 overflow-hidden rounded-[26px] border border-[#F0E3EB] bg-gradient-to-br from-[#F8EAF1] via-[#F8F0F5] to-[#F0EDF8] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border-[24px] border-white/20" />
          <div className="pointer-events-none absolute -bottom-16 right-32 h-40 w-40 rounded-full bg-white/20 blur-2xl" />

          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[#A77D9A]">
              <Sparkles size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                A LITTLE SPACE FOR EVERYTHING
              </span>
            </div>

            <h2 className="max-w-xl text-2xl font-semibold leading-tight text-[#574657] sm:text-3xl">
              Your life, gathered in one place.
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-[#8F7C8D]">
              Keep track of what matters, make room for what you are learning,
              and take things one step at a time.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 rounded-xl bg-[#A77D9A] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#916782]"
              >
                <CheckCircle2 size={14} />
                My tasks
              </Link>

              <Link
                href="/calendar"
                className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/65 px-4 py-2.5 text-xs font-semibold text-[#896B83] transition hover:bg-white"
              >
                <CalendarDays size={14} />
                Open calendar
              </Link>
            </div>
          </div>

          <div className="absolute bottom-5 right-6 hidden text-[#C49DB7]/60 sm:block">
            <Heart size={54} strokeWidth={1} />
          </div>
        </section>

        {/* TODAY: PRIMARY FOCAL POINT */}
        <section className="mb-8">
          <div className="mb-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B58AA6]">
              YOUR DAY, AT A GLANCE
            </p>
            <h2 className="text-xl font-semibold text-[#493D49]">Today</h2>
            <p className="mt-1 text-xs text-[#9B8D98]">
              Start with what's happening today.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* TODAY'S TASKS */}
            <div className="rounded-2xl border border-[#EDE1E9] bg-white p-5 shadow-[0_5px_20px_rgba(93,64,85,0.045)]">
              <SectionHeading
                eyebrow="ONE STEP AT A TIME"
                title="Today's tasks"
                description="Tasks with a due date of today."
                href="/tasks"
                icon={CheckCircle2}
              />

              {todayTasks.length > 0 ? (
                <div>
                  {todayTasks.slice(0, 6).map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}

                  {todayTasks.length > 6 && (
                    <Link
                      href="/tasks"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#A77D9A]"
                    >
                      See {todayTasks.length - 6} more <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="A little breathing room"
                  description="You don't have any tasks due today."
                  href="/tasks"
                  action="Open your tasks"
                />
              )}
            </div>

            {/* TODAY'S EVENTS */}
            <div className="rounded-2xl border border-[#EDE1E9] bg-white p-5 shadow-[0_5px_20px_rgba(93,64,85,0.045)]">
              <SectionHeading
                eyebrow="ON YOUR CALENDAR"
                title="Today's events"
                description="What's scheduled for today."
                href="/calendar"
                icon={CalendarDays}
              />

              {todayEvents.length > 0 ? (
                <div>
                  {todayEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="Nothing scheduled today"
                  description="Your calendar is clear for today."
                  href="/calendar"
                  action="Open calendar"
                />
              )}
            </div>
          </div>
        </section>

        {/* OVERDUE TASKS */}
        {taskStats.overdue.length > 0 && (
          <section className="mb-8 rounded-2xl border border-[#F1DDE1] bg-[#FFF9FA] p-5">
            <SectionHeading
              eyebrow="NEEDS YOUR ATTENTION"
              title="Past-due tasks"
              description="Tasks with a due date before today that aren't marked complete."
              href="/tasks"
              icon={Clock3}
            />

            {taskStats.overdue.slice(0, 5).map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}

            {taskStats.overdue.length > 5 && (
              <Link
                href="/tasks"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#B47C89]"
              >
                View all overdue tasks <ArrowRight size={13} />
              </Link>
            )}
          </section>
        )}

        {/* UPCOMING EVENTS */}
        <section className="mb-8 rounded-2xl border border-[#EDE1E9] bg-white p-5 shadow-[0_3px_14px_rgba(93,64,85,0.035)]">
          <SectionHeading
            eyebrow="COMING UP"
            title="The next few days"
            description="Upcoming tasks, project deadlines, and milestones from your calendar."
            href="/calendar"
            icon={CalendarDays}
          />

          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {upcomingEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Nothing coming up yet"
              description="When you add dated tasks, project deadlines, or milestones, they'll appear here."
              href="/calendar"
              action="Open calendar"
            />
          )}
        </section>

        {/* OVERVIEW: PLACED AFTER TODAY AND UPCOMING */}
        <section className="mb-9">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#493D49]">
              Your little overview
            </h2>
            <p className="mt-1 text-xs text-[#9B8D98]">
              Based on your saved information
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={CheckCircle2}
              label="Tasks completed"
              value={taskStats.completed}
              detail={`${taskStats.completionRate}% of all tasks`}
              tone="sage"
            />
            <StatCard
              icon={Clock3}
              label="Tasks to do"
              value={taskStats.active.length}
              detail={`${taskStats.overdue.length} overdue`}
              tone="pink"
            />
            <StatCard
              icon={FolderKanban}
              label="Active projects"
              value={activeProjects.length}
              detail={`${projects.length} total projects`}
              tone="purple"
            />
            <StatCard
              icon={Target}
              label="Active goals"
              value={activeGoals.length}
              detail={`${goals.length} total goals`}
              tone="beige"
            />
          </div>
        </section>

        {/* GOALS */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="WHAT YOU'RE WORKING TOWARD"
            title="Your goals"
            description="A snapshot of the goals you're actively working on."
            href="/goals"
            icon={Target}
          />

          {activeGoals.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="Your goals will live here"
              description="Add a goal to keep the things you're working toward in view."
              href="/goals"
              action="Explore goals"
            />
          )}
        </section>

        {/* PROJECTS */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="THINGS IN MOTION"
            title="Your projects"
            description="Projects that are currently in progress."
            href="/projects"
            icon={FolderKanban}
          />

          {activeProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {activeProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-2xl border border-[#F0E7ED] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(93,64,85,0.07)]"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5EEF4] text-[#A77D9A]">
                      <FolderKanban size={15} />
                    </div>
                    <p className="truncate text-sm font-semibold text-[#5A4C59]">
                      {project.title}
                    </p>
                  </div>

                  {project.description && (
                    <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-[#A99BA7]">
                      {project.description}
                    </p>
                  )}

                  {project.targetDate && (
                    <p className="mt-3 text-[10px] text-[#A99BA7]">
                      Deadline: {formatDate(project.targetDate)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No active projects"
              description="Your active projects will appear here."
              href="/projects"
              action="Open projects"
            />
          )}
        </section>

        {/* FINANCE */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="MONEY MATTERS"
            title="Your finances"
            description="Your savings goals and recent money activity."
            href="/finance"
            icon={Wallet}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* SAVINGS GOALS */}

            <div className="rounded-2xl border border-[#F0E7ED] bg-white p-5 shadow-[0_3px_14px_rgba(93,64,85,0.035)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#5A4C59]">
                    Savings goals
                  </p>
                  <p className="mt-1 text-[10px] text-[#A99BA7]">
                    Your progress toward each target.
                  </p>
                </div>
                <Coins size={19} className="text-[#B58AA6]" />
              </div>

              {financialGoals.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {financialGoals.map((goal) => {
                    const financial = goal.financialGoal;

                    return (
                      <Link
                        key={goal.id}
                        href={`/goals/${goal.id}`}
                        className="block min-w-0 transition hover:-translate-y-1"
                      >
                        <SavingsJar
                          title={goal.title}
                          currentAmount={financial?.currentAmount || 0}
                          targetAmount={financial?.targetAmount || 0}
                          currency={financial?.currency || "ETB"}
                          progress={financial?.progress || 0}
                          compact
                        />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="No savings goals yet"
                  description="Create a financial goal to keep your savings progress visible."
                  href="/goals"
                  action="Create a goal"
                />
              )}
            </div>

            {/* TRANSACTION OVERVIEW */}
            <div className="rounded-2xl border border-[#F0E7ED] bg-white p-5 shadow-[0_3px_14px_rgba(93,64,85,0.035)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#5A4C59]">
                    Money overview
                  </p>
                  <p className="mt-1 text-[10px] text-[#A99BA7]">
                    Totals from your recorded transactions.
                  </p>
                </div>
                <Wallet size={19} className="text-[#B58AA6]" />
              </div>

              {financeSummary.length > 0 ? (
                <div className="space-y-4">
                  {financeSummary.map(([currency, totals]) => (
                    <div key={currency} className="rounded-xl bg-[#FCF8FB] p-3">
                      <p className="mb-3 text-xs font-semibold text-[#776477]">
                        {currency}
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="mb-1 flex items-center gap-1 text-[9px] text-[#8CA58F]">
                            <ArrowDownRight size={12} /> Income
                          </div>
                          <p className="text-xs font-semibold text-[#657D68]">
                            {formatAmount(totals.income, currency)}
                          </p>
                        </div>

                        <div>
                          <div className="mb-1 flex items-center gap-1 text-[9px] text-[#C18B95]">
                            <ArrowUpRight size={12} /> Expenses
                          </div>
                          <p className="text-xs font-semibold text-[#A8757F]">
                            {formatAmount(totals.expenses, currency)}
                          </p>
                        </div>

                        <div>
                          <div className="mb-1 flex items-center gap-1 text-[9px] text-[#9B8BB8]">
                            <Coins size={12} /> Net saved
                          </div>
                          <p className="text-xs font-semibold text-[#8876A3]">
                            {formatAmount(totals.savings, currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="No transactions recorded"
                  description="Your income, expenses, and savings activity will appear here."
                  href="/finance"
                  action="Open finance"
                />
              )}

              {recentTransactions.length > 0 && (
                <div className="mt-4 border-t border-[#F2EAF0] pt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#A99BA7]">
                    Recent activity
                  </p>

                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[#655565]">
                          {transaction.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#A99BA7]">
                          {formatDate(transaction.date)}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs font-semibold text-[#786779]">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* LEARNING */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="ALWAYS GROWING"
            title="Your learning"
            description="A look at the learning paths you're working through."
            href="/learning"
            icon={GraduationCap}
          />

          {activeLearning.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {activeLearning.map((path) => (
                <LearningCard key={path.id} path={path} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Your learning space is ready"
              description="Create a learning path to keep your studies and progress together."
              href="/learning"
              action="Open learning"
            />
          )}
        </section>

        {/* JOURNAL */}
        <section className="mb-8">
          <SectionHeading
            eyebrow="THOUGHTS & MOMENTS"
            title="Recently in your journal"
            description="A few of your latest entries."
            href="/journal"
            icon={Feather}
          />

          {recentJournal.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {recentJournal.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/journal?entry=${entry.id}`}
                  className="rounded-2xl border border-[#F0E7ED] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(93,64,85,0.07)]"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#F7EFF4] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#A7839B]">
                      {String(entry.type || "DAILY").replaceAll("_", " ")}
                    </span>
                    <span className="text-[10px] text-[#A99BA7]">
                      {formatDate(entry.entryDate || entry.createdAt)}
                    </span>
                  </div>

                  <p className="line-clamp-1 text-sm font-semibold text-[#5A4C59]">
                    {entry.title || "Untitled entry"}
                  </p>

                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-[#9B8D98]">
                    {entry.content}
                  </p>

                  {entry.mood && (
                    <p className="mt-3 text-[10px] text-[#B58AA6]">
                      Mood: {entry.mood}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Feather}
              title="Your journal starts here"
              description="Your recent reflections, ideas, and daily entries will appear here."
              href="/journal"
              action="Open journal"
            />
          )}
        </section>

        {/* QUICK LINKS */}
        <section className="mb-5 rounded-2xl border border-[#EEE4ED] bg-gradient-to-r from-[#F8EFF4] to-[#F2EFF8] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#655565]">
                Make a little room for yourself.
              </p>
              <p className="mt-1 text-xs text-[#9B8D98]">
                Your calendar, ideas, plans, and progress are all waiting for
                you.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/vision"
                className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/80 px-3 py-2 text-xs font-semibold text-[#8F7188] transition hover:bg-white"
              >
                <Compass size={14} /> Vision board
              </Link>

              <Link
                href="/finance"
                className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/80 px-3 py-2 text-xs font-semibold text-[#8F7188] transition hover:bg-white"
              >
                <Wallet size={14} /> Finance
              </Link>

              <Link
                href="/learning"
                className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/80 px-3 py-2 text-xs font-semibold text-[#8F7188] transition hover:bg-white"
              >
                <BookOpen size={14} /> Learning
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
