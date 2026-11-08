"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Coins,
  Target,
  CalendarDays,
  Check,
  Pause,
  Play,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
  FolderKanban,
  Flag,
  Sparkles,
  LoaderCircle,
  AlertCircle,
  ChevronDown,
  CircleCheck,
  Clock3,
} from "lucide-react";

const FILTERS = [
  { id: "ALL", label: "All goals" },
  { id: "ACTIVE", label: "Active" },
  { id: "COMPLETED", label: "Completed" },
  { id: "PAUSED", label: "Paused" },
];

const emptyForm = {
  title: "",
  description: "",
  targetDate: "",
  status: "ACTIVE",
  visionItemIds: [],
  projectIds: [],
};

const emptyFinancialForm = {
  title: "",
  description: "",
  targetDate: "",
  status: "ACTIVE",
  targetAmount: "",
  currency: "ETB",
  visionItemIds: [],
};

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
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDateState(date, status) {
  if (!date || status === "COMPLETED") return null;

  const target = new Date(date);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  if (target < today) return "Overdue";
  if (target.getTime() === today.getTime()) return "Due today";

  return null;
}

function getGoalProgress(goal) {
  if (goal.type === "FINANCIAL") {
    return goal.financialGoal?.progress || 0;
  }

  return goal.progress || 0;
}

function formatMoney(amount, currency = "ETB") {
  const value = Number(amount || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function GoalCard({ goal, onEdit, onStatusChange, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const status = statusStyles[goal.status] || statusStyles.ACTIVE;
  const dateState = getDateState(goal.targetDate, goal.status);
  const isFinancial = goal.type === "FINANCIAL";
  const progress = getGoalProgress(goal);

  const financialGoal = goal.financialGoal;
  const currentAmount = financialGoal?.currentAmount || 0;
  const targetAmount = financialGoal?.targetAmount || 0;
  const currency = financialGoal?.currency || "ETB";

  return (
    <article className="group relative flex flex-col overflow-visible rounded-[22px] border border-[#EAE3E4] bg-white p-5 shadow-[0_4px_18px_rgba(76,52,63,0.045)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(76,52,63,0.09)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${status.color}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${
              isFinancial
                ? "bg-[#F8F0DF] text-[#9B7B42]"
                : "bg-[#F5EFF4] text-[#94748A]"
            }`}
          >
            {isFinancial ? <Coins size={11} /> : <Target size={11} />}
            {isFinancial ? "Financial" : "General"}
          </span>

          {dateState && (
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                dateState === "Overdue"
                  ? "bg-[#FBE8E5] text-[#B65C50]"
                  : "bg-[#FFF3D9] text-[#9C7838]"
              }`}
            >
              {dateState}
            </span>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-2 text-[#A49A9D] transition hover:bg-[#F7F2F3] hover:text-[#5E5055]"
            aria-label="Goal options"
          >
            <ChevronDown size={17} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-[#EEE5E7] bg-white py-1 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(goal);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#65585D] hover:bg-[#FAF5F6]"
              >
                <Pencil size={14} /> Edit goal
              </button>

              {goal.status !== "COMPLETED" && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onStatusChange(
                      goal.id,
                      goal.status === "PAUSED" ? "ACTIVE" : "PAUSED",
                    );
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#65585D] hover:bg-[#FAF5F6]"
                >
                  {goal.status === "PAUSED" ? (
                    <>
                      <Play size={14} /> Resume goal
                    </>
                  ) : (
                    <>
                      <Pause size={14} /> Pause goal
                    </>
                  )}
                </button>
              )}

              {goal.status !== "COMPLETED" && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onStatusChange(goal.id, "COMPLETED");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#65585D] hover:bg-[#FAF5F6]"
                >
                  <Check size={14} /> Mark completed
                </button>
              )}

              {goal.status === "COMPLETED" && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onStatusChange(goal.id, "ACTIVE");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#65585D] hover:bg-[#FAF5F6]"
                >
                  <Play size={14} /> Reopen goal
                </button>
              )}

              <div className="my-1 border-t border-[#F0E9EA]" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(goal);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#B45F5F] hover:bg-[#FFF3F1]"
              >
                <Trash2 size={14} /> Delete goal
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="mb-2 text-[18px] font-semibold leading-snug text-[#44383D]">
        {goal.title}
      </h3>

      {goal.description ? (
        <p className="mb-5 line-clamp-2 min-h-[40px] text-[13px] leading-relaxed text-[#91858A]">
          {goal.description}
        </p>
      ) : (
        <div className="mb-5 min-h-[40px]" />
      )}

      <div className="mb-5 rounded-xl bg-[#FAF7F7] p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-[#82767B]">
            {isFinancial ? "Savings progress" : "Overall progress"}
          </span>

          <span className="text-sm font-bold tabular-nums text-[#67535D]">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#EDE6E8]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFinancial
                ? "bg-gradient-to-r from-[#E5C98C] to-[#B99755]"
                : "bg-gradient-to-r from-[#D99BB2] to-[#B989A7]"
            }`}
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </div>

        {isFinancial ? (
          <div className="mt-3 flex items-center justify-between gap-2 text-[10px]">
            <span className="font-medium text-[#9A8966]">
              {formatMoney(currentAmount, currency)} saved
            </span>
            <span className="text-[#A3979C]">
              of {formatMoney(targetAmount, currency)}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-[10px] text-[#A3979C]">
            Based on completed tasks in linked projects
          </p>
        )}
      </div>

      {!isFinancial && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5EFF4] px-2.5 py-1.5 text-[11px] text-[#866D83]">
            <FolderKanban size={12} />
            {goal.projects?.length || 0} projects
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F0F3F8] px-2.5 py-1.5 text-[11px] text-[#74849D]">
            <ImageIcon size={12} />
            {goal.visionItems?.length || 0} vision items
          </span>
        </div>
      )}

      {isFinancial && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#FBF7ED] px-3 py-2 text-[11px] text-[#987C48]">
          <Coins size={13} />
          {formatMoney(
            Math.max(0, targetAmount - currentAmount),
            currency,
          )}{" "}
          remaining
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-[#F1EAEC] pt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[#9B8E94]">
          <CalendarDays size={13} />
          {goal.targetDate
            ? `Target: ${formatDate(goal.targetDate)}`
            : "No target date"}
        </div>

        <Link
          href={`/goals/${goal.id}`}
          className="text-xs font-semibold text-[#B47C96] transition hover:text-[#925C76]"
        >
          View details
        </Link>
      </div>
    </article>
  );
}

function GoalModal({
  open,
  onClose,
  onSave,
  goal,
  visionItems,
  projects,
  saving,
}) {
  const [activeTab, setActiveTab] = useState("GENERAL");
  const [form, setForm] = useState(emptyForm);
  const [financialForm, setFinancialForm] = useState(emptyFinancialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (goal?.type === "FINANCIAL") {
      setActiveTab("FINANCIAL");

      setFinancialForm({
        title: goal.title || "",
        description: goal.description || "",
        targetDate: goal.targetDate
          ? new Date(goal.targetDate).toISOString().slice(0, 10)
          : "",
        status: goal.status || "ACTIVE",
        targetAmount: goal.financialGoal?.targetAmount ?? "",
        currency: goal.financialGoal?.currency || "ETB",
        visionItemIds: (goal.visionItems || []).map((item) => item.id),
      });
    } else if (goal) {
      setActiveTab("GENERAL");

      setForm({
        title: goal.title || "",
        description: goal.description || "",
        targetDate: goal.targetDate
          ? new Date(goal.targetDate).toISOString().slice(0, 10)
          : "",
        status: goal.status || "ACTIVE",
        visionItemIds: (goal.visionItems || []).map((item) => item.id),
        projectIds: (goal.projects || []).map((project) => project.id),
      });
    } else {
      setActiveTab("GENERAL");
      setForm(emptyForm);
      setFinancialForm(emptyFinancialForm);
    }

    setError("");
  }, [open, goal]);

  if (!open) return null;

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateFinancialField(name, value) {
    setFinancialForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleSelection(field, id) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter((itemId) => itemId !== id)
        : [...current[field], id],
    }));
  }
  function toggleFinancialVisionItem(id) {
    setFinancialForm((current) => ({
      ...current,
      visionItemIds: current.visionItemIds.includes(id)
        ? current.visionItemIds.filter((itemId) => itemId !== id)
        : [...current.visionItemIds, id],
    }));
  }
  async function submit(event) {
    event.preventDefault();
    setError("");

    if (activeTab === "GENERAL") {
      if (!form.title.trim()) {
        setError("Please enter a title for your goal.");
        return;
      }

      const result = await onSave({
        ...form,
        type: "GENERAL",
      });

      if (!result?.success) {
        setError(result?.message || "Something went wrong. Please try again.");
      }

      return;
    }

    if (!financialForm.title.trim()) {
      setError("Please enter a title for your financial goal.");
      return;
    }

    if (
      !financialForm.targetAmount ||
      Number(financialForm.targetAmount) <= 0
    ) {
      setError("Please enter a savings target greater than zero.");
      return;
    }

    const result = await onSave({
      ...financialForm,
      type: "FINANCIAL",
      targetAmount: Number(financialForm.targetAmount),
    });

    if (!result?.success) {
      setError(result?.message || "Something went wrong. Please try again.");
    }
  }

  const isEditing = Boolean(goal);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#30252B]/45 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="my-auto w-full max-w-[620px] overflow-hidden rounded-[24px] border border-white/70 bg-[#FFFCFC] shadow-[0_24px_80px_rgba(50,35,43,0.2)]">
        <div className="flex items-start justify-between border-b border-[#F0E6E9] bg-[#FBF2F5] px-6 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[#B47C96]">
              {activeTab === "FINANCIAL" ? (
                <Coins size={15} />
              ) : (
                <Sparkles size={15} />
              )}

              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                Make it happen
              </span>
            </div>

            <h2 className="text-xl font-semibold text-[#4B3B43]">
              {isEditing ? "Edit your goal" : "Create a new goal"}
            </h2>

            <p className="mt-1 text-xs text-[#98868F]">
              {activeTab === "FINANCIAL"
                ? "Give your savings goal a clear target."
                : "Give something important a place in your life."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-[#9A858F] transition hover:bg-white hover:text-[#594750]"
          >
            <X size={19} />
          </button>
        </div>

        {!isEditing && (
          <div className="border-b border-[#F0E6E9] bg-[#FFFCFC] px-6 pt-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F6EFF2] p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("GENERAL");
                  setError("");
                }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold transition ${
                  activeTab === "GENERAL"
                    ? "bg-white text-[#9E6681] shadow-sm"
                    : "text-[#A4939B] hover:text-[#795E6C]"
                }`}
              >
                <Target size={15} />
                General Goal
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("FINANCIAL");
                  setError("");
                }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold transition ${
                  activeTab === "FINANCIAL"
                    ? "bg-white text-[#A1834D] shadow-sm"
                    : "text-[#A4939B] hover:text-[#795E6C]"
                }`}
              >
                <Coins size={15} />
                Financial Goal
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={submit}
          className="max-h-[75vh] overflow-y-auto px-6 py-5"
        >
          {activeTab === "GENERAL" ? (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#66545D]">
                  Goal title <span className="text-[#C57D94]">*</span>
                </label>

                <input
                  autoFocus
                  maxLength={200}
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="What do you want to achieve?"
                  className="w-full rounded-xl border border-[#E9DDE2] bg-white px-4 py-3 text-sm text-[#51434A] outline-none transition placeholder:text-[#B9AEB3] focus:border-[#C994AA] focus:ring-3 focus:ring-[#EEDCE5]/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#66545D]">
                  Description
                </label>

                <textarea
                  rows={3}
                  maxLength={5000}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Why does this goal matter to you? What does success look like?"
                  className="w-full resize-y rounded-xl border border-[#E9DDE2] bg-white px-4 py-3 text-sm text-[#51434A] outline-none transition placeholder:text-[#B9AEB3] focus:border-[#C994AA] focus:ring-3 focus:ring-[#EEDCE5]/60"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#66545D]">
                    Target date
                  </label>

                  <input
                    type="date"
                    value={form.targetDate}
                    onChange={(event) =>
                      updateField("targetDate", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E9DDE2] bg-white px-3 py-3 text-sm text-[#66545D] outline-none focus:border-[#C994AA]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#66545D]">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E9DDE2] bg-white px-3 py-3 text-sm text-[#66545D] outline-none focus:border-[#C994AA]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#F0E8EA] pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5A4851]">
                      <ImageIcon size={15} className="text-[#B47C96]" />
                      Connect to your vision
                    </h3>

                    <p className="mt-1 text-[11px] text-[#A09197]">
                      Choose the Vision Board items that inspire this goal.
                    </p>
                  </div>

                  <span className="rounded-full bg-[#F6EDF2] px-2.5 py-1 text-[10px] font-semibold text-[#9A7088]">
                    {form.visionItemIds.length} selected
                  </span>
                </div>

                {visionItems.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {visionItems.map((item) => {
                      const selected = form.visionItemIds.includes(item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            toggleSelection("visionItemIds", item.id)
                          }
                          className={`relative overflow-hidden rounded-xl border p-2 text-left transition ${
                            selected
                              ? "border-[#C48BA5] bg-[#FCF3F7] ring-2 ring-[#EEDCE5]"
                              : "border-[#EEE5E8] bg-white hover:border-[#D9B7C7]"
                          }`}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="mb-2 h-20 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-[#F8F0F3] text-[#B88DA1]">
                              <ImageIcon size={22} />
                            </div>
                          )}

                          <p className="truncate text-[11px] font-medium text-[#67545E]">
                            {item.title || item.type}
                          </p>

                          {selected && (
                            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#B77E99] text-white">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#FAF6F7] px-4 py-5 text-center text-xs text-[#A19399]">
                    No Vision Board items yet. You can link them later.
                  </p>
                )}
              </div>

              <div className="border-t border-[#F0E8EA] pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5A4851]">
                      <FolderKanban size={15} className="text-[#8798B4]" />
                      Connect projects
                    </h3>

                    <p className="mt-1 text-[11px] text-[#A09197]">
                      Tasks in these projects will count toward goal progress.
                    </p>
                  </div>

                  <span className="rounded-full bg-[#EEF1F7] px-2.5 py-1 text-[10px] font-semibold text-[#7586A2]">
                    {form.projectIds.length} selected
                  </span>
                </div>

                {projects.length ? (
                  <div className="space-y-2">
                    {projects.map((project) => {
                      const selected = form.projectIds.includes(project.id);

                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() =>
                            toggleSelection("projectIds", project.id)
                          }
                          className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition ${
                            selected
                              ? "border-[#AAB8D0] bg-[#F3F5FA]"
                              : "border-[#EEE7E9] bg-white hover:border-[#C9D1E0]"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                selected
                                  ? "bg-[#DCE3F0] text-[#687D9F]"
                                  : "bg-[#F5F1F2] text-[#A3989D]"
                              }`}
                            >
                              <FolderKanban size={14} />
                            </span>

                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-[#65545C]">
                                {project.title}
                              </span>

                              <span className="block text-[10px] text-[#A3949A]">
                                {project.status
                                  .replaceAll("_", " ")
                                  .toLowerCase()}
                              </span>
                            </span>
                          </span>

                          <span
                            className={`ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-[#8799B8] bg-[#8799B8] text-white"
                                : "border-[#DCD2D6] text-transparent"
                            }`}
                          >
                            <Check size={12} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#FAF6F7] px-4 py-5 text-center text-xs text-[#A19399]">
                    No projects yet. You can connect projects later.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#EFE3C9] bg-[#FBF7ED] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#B18D4F] shadow-sm">
                    <Coins size={20} />
                  </span>

                  <div>
                    <h3 className="text-sm font-semibold text-[#75613C]">
                      Give your savings a purpose
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-[#9B8967]">
                      Set a target and track every contribution in your savings
                      jar. Your progress will update as you deposit or withdraw
                      money through Finance.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#66545D]">
                  Financial goal title <span className="text-[#C57D94]">*</span>
                </label>

                <input
                  autoFocus
                  maxLength={200}
                  value={financialForm.title}
                  onChange={(event) =>
                    updateFinancialField("title", event.target.value)
                  }
                  placeholder="e.g. Save for my new phone"
                  className="w-full rounded-xl border border-[#E9DDE2] bg-white px-4 py-3 text-sm text-[#51434A] outline-none transition placeholder:text-[#B9AEB3] focus:border-[#C9AB70] focus:ring-3 focus:ring-[#F3EBD9]/70"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#66545D]">
                  Description
                </label>

                <textarea
                  rows={3}
                  maxLength={5000}
                  value={financialForm.description}
                  onChange={(event) =>
                    updateFinancialField("description", event.target.value)
                  }
                  placeholder="What are you saving for?"
                  className="w-full resize-y rounded-xl border border-[#E9DDE2] bg-white px-4 py-3 text-sm text-[#51434A] outline-none transition placeholder:text-[#B9AEB3] focus:border-[#C9AB70] focus:ring-3 focus:ring-[#F3EBD9]/70"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#66545D]">
                  Savings target <span className="text-[#C57D94]">*</span>
                </label>

                <div className="grid grid-cols-[1fr_115px] gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={financialForm.targetAmount}
                    onChange={(event) =>
                      updateFinancialField("targetAmount", event.target.value)
                    }
                    placeholder="e.g. 50000"
                    className="min-w-0 rounded-xl border border-[#E9DDE2] bg-white px-4 py-3 text-sm text-[#51434A] outline-none transition placeholder:text-[#B9AEB3] focus:border-[#C9AB70] focus:ring-3 focus:ring-[#F3EBD9]/70"
                  />

                  <select
                    value={financialForm.currency}
                    onChange={(event) =>
                      updateFinancialField("currency", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E9DDE2] bg-white px-3 py-3 text-sm text-[#66545D] outline-none focus:border-[#C9AB70]"
                  >
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                  </select>
                </div>

                <p className="mt-2 text-[11px] text-[#A39478]">
                  You can add money to this goal later through your Finance
                  page.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#66545D]">
                    Target date
                  </label>

                  <input
                    type="date"
                    value={financialForm.targetDate}
                    onChange={(event) =>
                      updateFinancialField("targetDate", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E9DDE2] bg-white px-3 py-3 text-sm text-[#66545D] outline-none focus:border-[#C9AB70]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#66545D]">
                    Status
                  </label>

                  <select
                    value={financialForm.status}
                    onChange={(event) =>
                      updateFinancialField("status", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E9DDE2] bg-white px-3 py-3 text-sm text-[#66545D] outline-none focus:border-[#C9AB70]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-[#F0E8EA] pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[#5A4851]">
                      <ImageIcon size={15} className="text-[#B47C96]" />
                      Connect to your vision
                    </h3>
                    <p className="mt-1 text-[11px] text-[#A09197]">
                      Choose the Vision Board items that represent what you're
                      saving for.
                    </p>
                  </div>

                  <span className="rounded-full bg-[#F6EDF2] px-2.5 py-1 text-[10px] font-semibold text-[#9A7088]">
                    {financialForm.visionItemIds.length} selected
                  </span>
                </div>

                {visionItems.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {visionItems.map((item) => {
                      const selected = financialForm.visionItemIds.includes(
                        item.id,
                      );

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleFinancialVisionItem(item.id)}
                          className={`relative overflow-hidden rounded-xl border p-2 text-left transition ${
                            selected
                              ? "border-[#C48BA5] bg-[#FCF3F7] ring-2 ring-[#EEDCE5]"
                              : "border-[#EEE5E8] bg-white hover:border-[#D9B7C7]"
                          }`}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="mb-2 h-20 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <div className="mb-2 flex h-20 items-center justify-center rounded-lg bg-[#F8F0F3] text-[#B88DA1]">
                              <ImageIcon size={22} />
                            </div>
                          )}

                          <p className="truncate text-[11px] font-medium text-[#67545E]">
                            {item.title || item.type}
                          </p>

                          {selected && (
                            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#B77E99] text-white">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#FAF6F7] px-4 py-5 text-center text-xs text-[#A19399]">
                    No Vision Board items yet. You can link them later.
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#FFF0EE] px-3.5 py-3 text-xs text-[#B45D54]">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2 border-t border-[#F0E8EA] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#88777F] transition hover:bg-[#F7F1F3]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                activeTab === "FINANCIAL"
                  ? "bg-[#B18D4F] hover:bg-[#99763E]"
                  : "bg-[#B77E99] hover:bg-[#A66C88]"
              }`}
            >
              {saving && <LoaderCircle size={14} className="animate-spin" />}

              {isEditing
                ? "Save changes"
                : activeTab === "FINANCIAL"
                  ? "Create financial goal"
                  : "Create goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [visionItems, setVisionItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deleteGoal, setDeleteGoal] = useState(null);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/goals", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load goals.");
      }

      setGoals(data.goals || []);
      setVisionItems(data.visionItems || []);
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const counts = useMemo(
    () => ({
      ALL: goals.length,
      ACTIVE: goals.filter((goal) => goal.status === "ACTIVE").length,
      COMPLETED: goals.filter((goal) => goal.status === "COMPLETED").length,
      PAUSED: goals.filter((goal) => goal.status === "PAUSED").length,
    }),
    [goals],
  );

  const filteredGoals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return goals.filter((goal) => {
      const matchesFilter = filter === "ALL" || goal.status === filter;

      const matchesSearch =
        !normalizedSearch ||
        goal.title.toLowerCase().includes(normalizedSearch) ||
        (goal.description || "").toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [goals, filter, search]);

  const totalProgress = useMemo(() => {
    const activeGoals = goals.filter((goal) => goal.status === "ACTIVE");

    if (!activeGoals.length) return 0;

    return Math.round(
      activeGoals.reduce((total, goal) => total + getGoalProgress(goal), 0) /
        activeGoals.length,
    );
  }, [goals]);

  function openCreateModal() {
    setEditingGoal(null);
    setModalOpen(true);
  }

  function openEditModal(goal) {
    setEditingGoal(goal);
    setModalOpen(true);
  }

  async function saveGoal(form) {
    setSaving(true);

    const payload = {
      ...form,
      targetDate: form.targetDate || null,
    };

    try {
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : "/api/goals";

      const response = await fetch(url, {
        method: editingGoal ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Could not save your goal.",
        };
      }

      setModalOpen(false);
      setEditingGoal(null);
      await loadGoals();

      return { success: true };
    } catch {
      return {
        success: false,
        message: "Could not connect to the server. Please try again.",
      };
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id, status) {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update goal.");
      }

      await loadGoals();
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmDelete() {
    if (!deleteGoal) return;

    try {
      const response = await fetch(`/api/goals/${deleteGoal.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete goal.");
      }

      setDeleteGoal(null);
      await loadGoals();
    } catch (err) {
      setError(err.message);
      setDeleteGoal(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-[#51434A] sm:px-7 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1400px]">
        

        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#B47C96]">
              <Target size={17} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Your direction
              </span>
            </div>

            <h1 className="text-[32px] font-semibold tracking-tight text-[#45373F] sm:text-[38px]">
              Goals
              <span className="ml-2 text-[#C58FA7]">.</span>
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#988A90]">
              Turn the things you dream about into things you work toward.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#B77E99] px-5 py-3 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(183,126,153,0.2)] transition hover:-translate-y-0.5 hover:bg-[#A76D89] sm:self-auto"
          >
            <Plus size={17} />
            New goal
          </button>
        </header>

        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#F0D5D1] bg-[#FFF1EF] px-4 py-3 text-sm text-[#AD5D55]">
            <span className="flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-full p-1 hover:bg-[#FBE1DE]"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-[20px] border border-[#EEDFE5] bg-[#F9EDF2] p-5">
            <div className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-white/40" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#9E788C]">
                  Active goals
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#725365]">
                  {counts.ACTIVE}
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-[#B77E99]">
                <Target size={21} />
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[20px] border border-[#E2E9E2] bg-[#EFF5EF] p-5">
            <div className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-white/40" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#78927B]">
                  Completed goals
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#526F57]">
                  {counts.COMPLETED}
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-[#7C9B80]">
                <CircleCheck size={21} />
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[20px] border border-[#E9E4D8] bg-[#F7F2E7] p-5">
            <div className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-white/40" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#9A8966]">
                  Average active progress
                </p>
                <p className="mt-2 text-3xl font-semibold text-[#756443]">
                  {totalProgress}%
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-[#B69B62]">
                <Flag size={21} />
              </span>
            </div>
          </div>
        </section>

        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  filter === item.id
                    ? "bg-[#705565] text-white shadow-sm"
                    : "border border-[#EAE1E4] bg-white text-[#92838A] hover:border-[#D6B9C6] hover:text-[#815F72]"
                }`}
              >
                {item.label}

                <span
                  className={`ml-2 ${
                    filter === item.id ? "text-white/70" : "text-[#B5A7AD]"
                  }`}
                >
                  {counts[item.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-[260px]">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B2A5AA]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a goal..."
              className="w-full rounded-xl border border-[#EAE1E4] bg-white py-2.5 pl-10 pr-4 text-xs text-[#65545C] outline-none transition placeholder:text-[#B5A9AE] focus:border-[#C994AA]"
            />
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[22px] border border-[#EEE5E8] bg-white">
            <LoaderCircle size={26} className="animate-spin text-[#B77E99]" />
            <p className="text-xs text-[#9B8C93]">Gathering your goals...</p>
          </div>
        ) : filteredGoals.length ? (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditModal}
                onStatusChange={changeStatus}
                onDelete={setDeleteGoal}
              />
            ))}
          </section>
        ) : (
          <section className="flex min-h-[330px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#E5D6DD] bg-white/70 px-6 py-12 text-center">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F8EDF2] text-[#B77E99]">
              {search ? <Search size={27} /> : <Sparkles size={27} />}
            </span>

            <h2 className="text-lg font-semibold text-[#594750]">
              {search
                ? "No goals found"
                : filter === "ALL"
                  ? "Your next chapter starts here"
                  : `No ${filter.toLowerCase()} goals`}
            </h2>

            <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#A09298]">
              {search
                ? "Try another search term."
                : filter === "ALL"
                  ? "Start by adding something you want to achieve. You can connect it to your vision and projects as you go."
                  : "Goals with this status will appear here."}
            </p>

            {!search && filter === "ALL" && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B77E99] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#A76D89]"
              >
                <Plus size={15} />
                Create your first goal
              </button>
            )}
          </section>
        )}

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#EAE4E7] bg-white/70 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5EDF2] text-[#B47C96]">
            <Clock3 size={16} />
          </span>

          <div>
            <p className="text-xs font-semibold text-[#69565F]">
              Your progress updates as you work
            </p>

            <p className="mt-1 text-[11px] leading-relaxed text-[#9C8F95]">
              General goal progress is calculated from completed tasks in linked
              projects. Financial goal progress is calculated from contributions
              to its savings jar.
            </p>
          </div>
        </div>
      </div>

      <GoalModal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditingGoal(null);
          }
        }}
        onSave={saveGoal}
        goal={editingGoal}
        visionItems={visionItems}
        projects={projects}
        saving={saving}
      />

      {deleteGoal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#30252B]/45 p-4 backdrop-blur-[3px]">
          <div className="w-full max-w-[390px] rounded-[22px] border border-white bg-[#FFFCFC] p-6 shadow-2xl">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0EE] text-[#B45D54]">
              <Trash2 size={19} />
            </span>

            <h2 className="text-lg font-semibold text-[#514149]">
              Delete this goal?
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-[#95878D]">
              Are you sure you want to delete{" "}
              <strong className="font-semibold text-[#6A555F]">
                {deleteGoal.title}
              </strong>
              ? Its links to Vision Board items and projects will also be
              removed. The projects and their tasks will not be deleted.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteGoal(null)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#88777F] hover:bg-[#F7F1F3]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-[#B45D54] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#9F4D46]"
              >
                Delete goal
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
