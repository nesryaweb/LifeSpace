
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  Heart,
  LoaderCircle,
  NotebookPen,
  RefreshCw,
  Target,
  TrendingUp,
  Wallet,
  AlertCircle,
  FolderKanban,
  ListTodo,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = {
  blush: "#D98EAE",
  lavender: "#A991C8",
  sage: "#91B69A",
  peach: "#E9B58F",
  blue: "#91AFC9",
  rose: "#C77D9B",
  beige: "#C9B99D",
  muted: "#A8A0A9",
};

const CHART_COLORS = [
  COLORS.blush,
  COLORS.lavender,
  COLORS.sage,
  COLORS.peach,
  COLORS.blue,
  COLORS.beige,
];

const cardClass =
  "rounded-2xl border border-[#EEE7EC] bg-white p-5 shadow-[0_3px_14px_rgba(80,50,70,0.035)]";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getMonthKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getLastMonths(count = 6) {
  const today = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - (count - 1 - index),
      1
    );

    return {
      key: getMonthKey(date),
      month: date.toLocaleDateString("en", {
        month: "short",
        year: "2-digit",
      }),
    };
  });
}

function isSameMonth(date, year, month) {
  if (!date) return false;

  const parsed = new Date(date);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatPercent(value) {
  return `${Math.round(Number(value) || 0)}%`;
}

function formatCurrency(value, currency = "ETB") {
  const amount = Number(value) || 0;

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${formatNumber(amount)}`;
  }
}

function getStatusLabel(status) {
  const labels = {
    TODO: "To do",
    IN_PROGRESS: "In progress",
    DONE: "Completed",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    PAUSED: "Paused",
    ON_HOLD: "On hold",
  };

  return labels[status] || status || "Unknown";
}

function ProgressBar({ value, color = COLORS.blush }) {
  const progress = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#F3EFF2]">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${progress}%`, backgroundColor: color }}
      />
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-xl bg-[#F8F0F5] p-2.5 text-[#B77D9B]">
        <Icon size={19} />
      </div>

      <div>
        <h2 className="font-semibold text-[#443744]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-[#9A8E99]">{description}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  color = COLORS.blush,
}) {
  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#968A95]">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#443744]">
            {value}
          </p>
          {detail && (
            <p className="mt-1 text-xs text-[#A49AA3]">{detail}</p>
          )}
        </div>

        <div
          className="rounded-xl p-2.5"
          style={{
            color,
            backgroundColor: `${color}18`,
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-[250px] items-center justify-center rounded-xl bg-[#FBF9FA] px-6 text-center text-sm text-[#A49AA3]">
      {message}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[#EEE7EC] bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-[#756875]">{label}</p>

      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="text-xs"
          style={{ color: item.color }}
        >
          {item.name}: {formatNumber(item.value)}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState({
    tasks: [],
    goals: [],
    transactions: [],
    projects: [],
    learningPaths: [],
    journalEntries: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        "/api/tasks",
        "/api/goals",
        "/api/finance/transactions",
        "/api/projects",
        "/api/learning",
        "/api/journal",
      ];

      const responses = await Promise.all(
        endpoints.map((url) =>
          fetch(url, {
            cache: "no-store",
          })
        )
      );

      const failedResponse = responses.find((response) => !response.ok);

      if (failedResponse) {
        throw new Error(
          `One of the modules could not be loaded (${failedResponse.status}).`
        );
      }

      const [
        taskData,
        goalData,
        financeData,
        projectData,
        learningData,
        journalData,
      ] = await Promise.all(responses.map((response) => response.json()));

      setData({
        tasks: safeArray(taskData),
        goals: safeArray(goalData?.goals),
        transactions: safeArray(financeData?.transactions),
        projects: safeArray(projectData?.projects),
        learningPaths: safeArray(learningData),
        journalEntries: safeArray(journalData),
      });
    } catch (err) {
      console.error("Analytics loading error:", err);
      setError(
        err.message || "Something went wrong while loading your analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const analytics = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const tasks = data.tasks;
    const projects = data.projects;
    const goals = data.goals;
    const transactions = data.transactions;
    const learningPaths = data.learningPaths;
    const journalEntries = data.journalEntries;

    const completedTasks = tasks.filter(
      (task) => task.status === "DONE"
    );

    const inProgressTasks = tasks.filter(
      (task) => task.status === "IN_PROGRESS"
    );

    const todoTasks = tasks.filter(
      (task) => task.status === "TODO"
    );

    const overdueTasks = tasks.filter((task) => {
      if (!task.dueDate || task.status === "DONE") return false;

      const dueDate = new Date(task.dueDate);

      return (
        !Number.isNaN(dueDate.getTime()) &&
        dueDate < todayStart
      );
    });

    const taskCompletionRate = tasks.length
      ? (completedTasks.length / tasks.length) * 100
      : 0;

    const activeProjects = projects.filter(
      (project) => project.status === "ACTIVE"
    );

    const completedProjects = projects.filter(
      (project) => project.status === "COMPLETED"
    );

    const projectProgress =
      projects.length > 0
        ? projects.reduce(
            (total, project) => total + (Number(project.progress) || 0),
            0
          ) / projects.length
        : 0;

    const activeGoals = goals.filter(
      (goal) => goal.status === "ACTIVE"
    );

    const completedGoals = goals.filter(
      (goal) => goal.status === "COMPLETED"
    );

    const pausedGoals = goals.filter(
      (goal) => goal.status === "PAUSED"
    );

    const financialGoals = goals.filter(
      (goal) => goal.type === "FINANCIAL" && goal.financialGoal
    );

    const financialTotals = financialGoals.reduce((groups, goal) => {
      const financial = goal.financialGoal;
      const currency = financial.currency || "ETB";

      if (!groups[currency]) {
        groups[currency] = {
          currency,
          target: 0,
          current: 0,
          count: 0,
        };
      }

      groups[currency].target += Number(financial.targetAmount) || 0;
      groups[currency].current += Number(financial.currentAmount) || 0;
      groups[currency].count += 1;

      return groups;
    }, {});

    const incomeByCurrency = {};
    const expensesByCurrency = {};
    const savingsDepositsByCurrency = {};
    const savingsWithdrawalsByCurrency = {};

    transactions.forEach((transaction) => {
      const currency = transaction.currency || "ETB";
      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "INCOME") {
        incomeByCurrency[currency] =
          (incomeByCurrency[currency] || 0) + amount;
      }

      if (transaction.type === "EXPENSE") {
        expensesByCurrency[currency] =
          (expensesByCurrency[currency] || 0) + amount;
      }

      if (transaction.type === "SAVING_DEPOSIT") {
        savingsDepositsByCurrency[currency] =
          (savingsDepositsByCurrency[currency] || 0) + amount;
      }

      if (transaction.type === "SAVING_WITHDRAWAL") {
        savingsWithdrawalsByCurrency[currency] =
          (savingsWithdrawalsByCurrency[currency] || 0) + amount;
      }
    });

    const learningLessonCount = learningPaths.reduce(
      (total, path) => total + (Number(path.totalLessons) || 0),
      0
    );

    const completedLearningLessons = learningPaths.reduce(
      (total, path) => total + (Number(path.completedLessons) || 0),
      0
    );

    const learningProgress = learningLessonCount
      ? (completedLearningLessons / learningLessonCount) * 100
      : 0;

    const journalThisMonth = journalEntries.filter((entry) =>
      isSameMonth(entry.entryDate, today.getFullYear(), today.getMonth())
    );

    const months = getLastMonths(6);

    const monthlyActivity = months.map((month) => ({
      ...month,
      completedTasks: 0,
      journalEntries: 0,
    }));

    const monthlyFinance = months.map((month) => ({
      ...month,
      income: 0,
      expenses: 0,
    }));

    const monthIndex = new Map(
      months.map((month, index) => [month.key, index])
    );

    completedTasks.forEach((task) => {
      if (!task.completedAt) return;

      const index = monthIndex.get(getMonthKey(task.completedAt));

      if (index !== undefined) {
        monthlyActivity[index].completedTasks += 1;
      }
    });

    journalEntries.forEach((entry) => {
      const index = monthIndex.get(getMonthKey(entry.entryDate));

      if (index !== undefined) {
        monthlyActivity[index].journalEntries += 1;
      }
    });

    transactions.forEach((transaction) => {
      const index = monthIndex.get(getMonthKey(transaction.date));

      if (index === undefined) return;

      if (transaction.type === "INCOME") {
        monthlyFinance[index].income += Number(transaction.amount) || 0;
      }

      if (transaction.type === "EXPENSE") {
        monthlyFinance[index].expenses += Number(transaction.amount) || 0;
      }
    });

    const taskStatusData = [
      { name: "Completed", value: completedTasks.length },
      { name: "In progress", value: inProgressTasks.length },
      { name: "To do", value: todoTasks.length },
    ].filter((item) => item.value > 0);

    const projectStatusData = [
      { name: "Active", value: activeProjects.length },
      { name: "Completed", value: completedProjects.length },
      {
        name: "Other",
        value: projects.length - activeProjects.length - completedProjects.length,
      },
    ].filter((item) => item.value > 0);

    return {
      tasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      taskCompletionRate,
      projects,
      activeProjects,
      completedProjects,
      projectProgress,
      goals,
      activeGoals,
      completedGoals,
      pausedGoals,
      financialGoals,
      financialTotals: Object.values(financialTotals),
      incomeByCurrency,
      expensesByCurrency,
      savingsDepositsByCurrency,
      savingsWithdrawalsByCurrency,
      learningPaths,
      learningLessonCount,
      completedLearningLessons,
      learningProgress,
      journalEntries,
      journalThisMonth,
      monthlyActivity,
      monthlyFinance,
      taskStatusData,
      projectStatusData,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#968A95]">
          <LoaderCircle className="animate-spin" size={20} />
          Gathering your LifeSpace activity...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <div className="rounded-2xl border border-[#F0DDE5] bg-[#FFF8FA] p-8 text-center">
          <AlertCircle className="mx-auto mb-3 text-[#C77D9B]" size={28} />
          <h2 className="font-semibold text-[#443744]">
            Analytics couldn't load
          </h2>
          <p className="mt-2 text-sm text-[#968A95]">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B77D9B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#A96D8C]"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const hasAnyData =
    analytics.tasks.length > 0 ||
    analytics.projects.length > 0 ||
    analytics.goals.length > 0 ||
    data.transactions.length > 0 ||
    analytics.learningPaths.length > 0 ||
    analytics.journalEntries.length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-[#B1849C]">
            <Activity size={16} />
            <span>Your LifeSpace overview</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#443744]">
            Analytics
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#968A95]">
            A look at your progress, habits, projects, learning, and finances
            across LifeSpace.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 rounded-xl border border-[#EEE7EC] bg-white px-4 py-2.5 text-sm font-medium text-[#756875] transition hover:bg-[#FBF7F9]"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {!hasAnyData && (
        <div className="rounded-2xl border border-dashed border-[#E6D9E1] bg-[#FCF9FB] px-6 py-12 text-center">
          <Activity className="mx-auto mb-3 text-[#C39BB0]" size={30} />
          <h2 className="font-semibold text-[#443744]">
            Your analytics will grow with you
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#968A95]">
            Start adding tasks, goals, projects, journal entries, learning
            paths, and finance transactions. Your real activity will appear
            here automatically.
          </p>
        </div>
      )}

      {/* Main overview */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Heart size={17} className="text-[#C58AA5]" />
          <h2 className="font-semibold text-[#443744]">At a glance</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={ListTodo}
            label="Total tasks"
            value={formatNumber(analytics.tasks.length)}
            detail={`${analytics.completedTasks.length} completed`}
            color={COLORS.blush}
          />

          <StatCard
            icon={FolderKanban}
            label="Projects"
            value={formatNumber(analytics.projects.length)}
            detail={`${analytics.activeProjects.length} active`}
            color={COLORS.lavender}
          />

          <StatCard
            icon={Target}
            label="Goals"
            value={formatNumber(analytics.goals.length)}
            detail={`${analytics.activeGoals.length} active`}
            color={COLORS.sage}
          />

          <StatCard
            icon={NotebookPen}
            label="Journal entries"
            value={formatNumber(analytics.journalEntries.length)}
            detail={`${analytics.journalThisMonth.length} this month`}
            color={COLORS.peach}
          />
        </div>
      </section>

      {/* Tasks */}
      <section className={cardClass}>
        <SectionTitle
          icon={ListTodo}
          title="Task progress"
          description="How your tasks are moving along."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-sm text-[#968A95]">Completion rate</span>
              <span className="text-2xl font-semibold text-[#443744]">
                {formatPercent(analytics.taskCompletionRate)}
              </span>
            </div>

            <ProgressBar
              value={analytics.taskCompletionRate}
              color={COLORS.blush}
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                {
                  label: "Completed",
                  value: analytics.completedTasks.length,
                  color: COLORS.sage,
                },
                {
                  label: "In progress",
                  value: analytics.inProgressTasks.length,
                  color: COLORS.lavender,
                },
                {
                  label: "To do",
                  value: analytics.todoTasks.length,
                  color: COLORS.blue,
                },
                {
                  label: "Overdue",
                  value: analytics.overdueTasks.length,
                  color: COLORS.rose,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-[#FBF9FA] p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-[#968A95]">
                      {item.label}
                    </span>
                  </div>

                  <p className="mt-1 text-xl font-semibold text-[#443744]">
                    {formatNumber(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-[#756875]">
              Task status distribution
            </p>

            {analytics.taskStatusData.length ? (
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.taskStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={4}
                    >
                      {analytics.taskStatusData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            [COLORS.sage, COLORS.lavender, COLORS.blue][
                              index % 3
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="Your task status chart will appear once you add tasks." />
            )}
          </div>
        </div>
      </section>

      {/* Activity trends */}
      <section className={cardClass}>
        <SectionTitle
          icon={TrendingUp}
          title="Your activity"
          description="Completed tasks and journal entries over the last six months."
        />

        {analytics.monthlyActivity.some(
          (month) => month.completedTasks || month.journalEntries
        ) ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.monthlyActivity}
                margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid
                  stroke="#F0EAF0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#9A8E99", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#9A8E99", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px" }}
                />
                <Bar
                  dataKey="completedTasks"
                  name="Completed tasks"
                  fill={COLORS.blush}
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="journalEntries"
                  name="Journal entries"
                  fill={COLORS.lavender}
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Monthly activity will appear as you complete tasks and write journal entries." />
        )}
      </section>

      {/* Projects and goals */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className={cardClass}>
          <SectionTitle
            icon={FolderKanban}
            title="Projects"
            description="Your project status and average progress."
          />

          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm text-[#968A95]">Average progress</p>
              <p className="mt-1 text-3xl font-semibold text-[#443744]">
                {formatPercent(analytics.projectProgress)}
              </p>
            </div>

            <div className="text-right text-xs text-[#968A95]">
              <p>{analytics.activeProjects.length} active</p>
              <p>{analytics.completedProjects.length} completed</p>
            </div>
          </div>

          <ProgressBar
            value={analytics.projectProgress}
            color={COLORS.lavender}
          />

          {analytics.projectStatusData.length ? (
            <div className="mt-5 space-y-3">
              {analytics.projectStatusData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 text-[#756875]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: CHART_COLORS[index],
                      }}
                    />
                    {item.name}
                  </div>

                  <span className="font-medium text-[#443744]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#A49AA3]">
              No projects added yet.
            </p>
          )}
        </section>

        <section className={cardClass}>
          <SectionTitle
            icon={Target}
            title="Goals"
            description="Your goals and their current status."
          />

          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Active",
                value: analytics.activeGoals.length,
                color: COLORS.sage,
              },
              {
                label: "Completed",
                value: analytics.completedGoals.length,
                color: COLORS.lavender,
              },
              {
                label: "Paused",
                value: analytics.pausedGoals.length,
                color: COLORS.peach,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-[#FBF9FA] p-3 text-center"
              >
                <p
                  className="text-xl font-semibold"
                  style={{ color: item.color }}
                >
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-[#968A95]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {analytics.goals.slice(0, 4).map((goal) => (
              <div key={goal.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-[#5B4C5A]">
                    {goal.title}
                  </p>
                  <span className="shrink-0 text-xs text-[#968A95]">
                    {getStatusLabel(goal.status)}
                  </span>
                </div>

                <ProgressBar
                  value={
                    goal.type === "FINANCIAL"
                      ? goal.financialGoal?.progress
                      : goal.progress
                  }
                  color={
                    goal.type === "FINANCIAL"
                      ? COLORS.sage
                      : COLORS.blush
                  }
                />
              </div>
            ))}

            {!analytics.goals.length && (
              <p className="text-sm text-[#A49AA3]">
                Your goals will appear here once you create them.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Finance */}
      <section className={cardClass}>
        <SectionTitle
          icon={Wallet}
          title="Financial overview"
          description="Income, expenses, and savings from your Finance records."
        />

        {data.transactions.length === 0 &&
        analytics.financialGoals.length === 0 ? (
          <p className="rounded-xl bg-[#FBF9FA] p-5 text-sm text-[#A49AA3]">
            Add finance transactions or create a financial goal to see your
            financial overview here.
          </p>
        ) : (
          <>
            {Object.keys(analytics.incomeByCurrency).length ||
            Object.keys(analytics.expensesByCurrency).length ? (
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Income",
                    icon: ArrowDownLeft,
                    values: analytics.incomeByCurrency,
                    color: COLORS.sage,
                  },
                  {
                    label: "Expenses",
                    icon: ArrowUpRight,
                    values: analytics.expensesByCurrency,
                    color: COLORS.rose,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-[#FBF9FA] p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-[#968A95]">
                      <item.icon size={16} style={{ color: item.color }} />
                      {item.label}
                    </div>

                    <div className="mt-2 space-y-1">
                      {Object.entries(item.values).length ? (
                        Object.entries(item.values).map(
                          ([currency, amount]) => (
                            <p
                              key={currency}
                              className="text-lg font-semibold text-[#443744]"
                            >
                              {formatCurrency(amount, currency)}
                            </p>
                          )
                        )
                      ) : (
                        <p className="text-lg font-semibold text-[#443744]">
                          —
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-[#FBF9FA] p-4">
                  <div className="flex items-center gap-2 text-sm text-[#968A95]">
                    <CircleDollarSign
                      size={16}
                      className="text-[#A991C8]"
                    />
                    Net cash flow
                  </div>

                  <div className="mt-2 space-y-1">
                    {Array.from(
                      new Set([
                        ...Object.keys(analytics.incomeByCurrency),
                        ...Object.keys(analytics.expensesByCurrency),
                      ])
                    ).map((currency) => {
                      const net =
                        (analytics.incomeByCurrency[currency] || 0) -
                        (analytics.expensesByCurrency[currency] || 0);

                      return (
                        <p
                          key={currency}
                          className="text-lg font-semibold text-[#443744]"
                        >
                          {formatCurrency(net, currency)}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mb-5 text-sm text-[#A49AA3]">
                No income or expense transactions recorded yet.
              </p>
            )}

            {analytics.monthlyFinance.some(
              (month) => month.income || month.expenses
            ) && (
              <div className="mb-7">
                <p className="mb-3 text-sm font-medium text-[#756875]">
                  Income and expenses · last six months
                </p>

                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.monthlyFinance}
                      margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#F0EAF0"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#9A8E99", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#9A8E99", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                      <Bar
                        dataKey="income"
                        name="Income"
                        fill={COLORS.sage}
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="expenses"
                        name="Expenses"
                        fill={COLORS.rose}
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="mt-2 text-xs text-[#A49AA3]">
                  Monthly chart combines transaction amounts. If you use
                  multiple currencies, view the totals above by currency
                  rather than comparing the chart as a single-currency total.
                </p>
              </div>
            )}

            <div>
              <p className="mb-3 text-sm font-medium text-[#756875]">
                Financial goals and savings
              </p>

              {analytics.financialGoals.length ? (
                <div className="space-y-4">
                  {analytics.financialTotals.map((item) => {
                    const progress = item.target
                      ? (item.current / item.target) * 100
                      : 0;

                    return (
                      <div key={item.currency}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-medium text-[#5B4C5A]">
                            {item.count} financial{" "}
                            {item.count === 1 ? "goal" : "goals"} ·{" "}
                            {item.currency}
                          </span>

                          <span className="text-xs text-[#968A95]">
                            {formatCurrency(item.current, item.currency)} of{" "}
                            {formatCurrency(item.target, item.currency)}
                          </span>
                        </div>

                        <ProgressBar
                          value={progress}
                          color={COLORS.sage}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#A49AA3]">
                  You haven't created any financial goals yet.
                </p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Savings deposits",
                  values: analytics.savingsDepositsByCurrency,
                },
                {
                  label: "Savings withdrawals",
                  values: analytics.savingsWithdrawalsByCurrency,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[#F0EAF0] p-4"
                >
                  <p className="text-xs text-[#968A95]">{item.label}</p>

                  {Object.entries(item.values).length ? (
                    Object.entries(item.values).map(
                      ([currency, amount]) => (
                        <p
                          key={currency}
                          className="mt-1 text-base font-semibold text-[#443744]"
                        >
                          {formatCurrency(amount, currency)}
                        </p>
                      )
                    )
                  ) : (
                    <p className="mt-1 text-base font-semibold text-[#443744]">
                      —
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Learning and journal */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className={cardClass}>
          <SectionTitle
            icon={GraduationCap}
            title="Learning"
            description="Your learning paths and lesson progress."
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#FBF9FA] p-4">
              <p className="text-xs text-[#968A95]">Learning paths</p>
              <p className="mt-1 text-2xl font-semibold text-[#443744]">
                {analytics.learningPaths.length}
              </p>
            </div>

            <div className="rounded-xl bg-[#FBF9FA] p-4">
              <p className="text-xs text-[#968A95]">Lessons completed</p>
              <p className="mt-1 text-2xl font-semibold text-[#443744]">
                {analytics.completedLearningLessons}
                <span className="ml-1 text-sm font-normal text-[#A49AA3]">
                  / {analytics.learningLessonCount}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-[#968A95]">
                Overall lesson progress
              </span>
              <span className="text-sm font-semibold text-[#443744]">
                {formatPercent(analytics.learningProgress)}
              </span>
            </div>

            <ProgressBar
              value={analytics.learningProgress}
              color={COLORS.lavender}
            />
          </div>

          {analytics.learningPaths.length > 0 && (
            <div className="mt-5 space-y-4">
              {analytics.learningPaths.slice(0, 4).map((path) => (
                <div key={path.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-[#5B4C5A]">
                      {path.title}
                    </span>
                    <span className="shrink-0 text-xs text-[#968A95]">
                      {formatPercent(path.progress)}
                    </span>
                  </div>

                  <ProgressBar
                    value={path.progress}
                    color={COLORS.lavender}
                  />
                </div>
              ))}
            </div>
          )}

          {!analytics.learningPaths.length && (
            <p className="mt-5 text-sm text-[#A49AA3]">
              Your learning paths will appear here.
            </p>
          )}
        </section>

        <section className={cardClass}>
          <SectionTitle
            icon={NotebookPen}
            title="Journal"
            description="A small look at your writing activity."
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#FBF9FA] p-4">
              <p className="text-xs text-[#968A95]">All entries</p>
              <p className="mt-1 text-2xl font-semibold text-[#443744]">
                {analytics.journalEntries.length}
              </p>
            </div>

            <div className="rounded-xl bg-[#FBF9FA] p-4">
              <p className="text-xs text-[#968A95]">This month</p>
              <p className="mt-1 text-2xl font-semibold text-[#443744]">
                {analytics.journalThisMonth.length}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-medium text-[#756875]">
              Recent entries
            </p>

            {analytics.journalEntries.length ? (
              <div className="space-y-3">
                {[...analytics.journalEntries]
                  .sort(
                    (a, b) =>
                      new Date(b.entryDate) - new Date(a.entryDate)
                  )
                  .slice(0, 4)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between gap-3 border-b border-[#F2EDF1] pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#5B4C5A]">
                          {entry.title || "Untitled entry"}
                        </p>
                        <p className="mt-1 text-xs text-[#A49AA3]">
                          {getStatusLabel(entry.type)}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-[#A49AA3]">
                        {new Date(entry.entryDate).toLocaleDateString(
                          "en",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-[#A49AA3]">
                Your journal entries will appear here.
              </p>
            )}
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-[#B0A5AE]">
        Analytics is calculated from your saved LifeSpace records. Changes in
        your modules will appear here when you refresh.
      </p>
    </div>
  );
}
