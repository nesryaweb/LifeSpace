
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  FolderKanban,
  CalendarDays,
  Clock3,
  Pencil,
  Trash2,
  X,
  ArrowUpRight,
  Target,
  ListTodo,
  Check,
  ChevronDown,
} from "lucide-react";

const STATUSES = [
  { value: "ALL", label: "All projects" },
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const STATUS_STYLES = {
  PLANNED: "bg-[#F0EBF4] text-[#81718E]",
  ACTIVE: "bg-[#E5F0E8] text-[#64836C]",
  ON_HOLD: "bg-[#F8EEDC] text-[#A47D43]",
  COMPLETED: "bg-[#E5F0E8] text-[#64836C]",
  ARCHIVED: "bg-[#F0EEEE] text-[#8C8585]",
};

const PRIORITY_STYLES = {
  LOW: "bg-[#EDF2EA] text-[#81917B]",
  MEDIUM: "bg-[#F8F0DF] text-[#A47D43]",
  HIGH: "bg-[#F8E8EB] text-[#B87582]",
  URGENT: "bg-[#F9E2E4] text-[#B44F5C]",
};

const inputClass =
  "w-full rounded-xl border border-[#EDE2E3] bg-[#FDFBFA] px-3.5 py-3 text-sm text-[#594A51] outline-none transition placeholder:text-[#B7A9AE] focus:border-[#C7A0B2] focus:ring-2 focus:ring-[#C7A0B2]/15";

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function getProjectProgress(project) {
  if (typeof project.progress === "number") return project.progress;

  const tasks = project.tasks || [];
  if (!tasks.length) return 0;

  const completed = tasks.filter((task) => task.status === "DONE").length;

  return Math.round((completed / tasks.length) * 100);
}

function getTaskCount(project) {
  if (typeof project.taskCount === "number") return project.taskCount;
  return project.tasks?.length || 0;
}

function getCompletedTaskCount(project) {
  if (typeof project.completedTaskCount === "number") {
    return project.completedTaskCount;
  }

  return (
    project.tasks?.filter((task) => task.status === "DONE").length || 0
  );
}

function getProjectGoals(project) {
  if (Array.isArray(project.goals)) return project.goals;

  return (project.goalLinks || [])
    .map((link) => link.goal || link)
    .filter((goal) => goal?.id);
}

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
        STATUS_STYLES[status] || STATUS_STYLES.PLANNED
      }`}
    >
      {STATUSES.find((item) => item.value === status)?.label || status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM
      }`}
    >
      {priority?.toLowerCase() || "medium"}
    </span>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#88777F]">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [priority, setPriority] = useState("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedGoalIds, setSelectedGoalIds] = useState([]);
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);

  const goalDropdownRef = useRef(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load your projects.");
      }

      setProjects(data.projects || []);
      setGoals(data.goals || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Close the goals dropdown when clicking outside it.
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        goalDropdownRef.current &&
        !goalDropdownRef.current.contains(event.target)
      ) {
        setGoalDropdownOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setGoalDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "ALL" || project.status === statusFilter;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        project.title?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        getProjectGoals(project).some((goal) =>
          goal.title?.toLowerCase().includes(query)
        );

      return matchesStatus && matchesSearch;
    });
  }, [projects, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: projects.filter((project) => project.status !== "ARCHIVED").length,
      active: projects.filter((project) => project.status === "ACTIVE").length,
      completed: projects.filter(
        (project) => project.status === "COMPLETED"
      ).length,
      planned: projects.filter((project) => project.status === "PLANNED")
        .length,
    };
  }, [projects]);

  const selectedGoals = useMemo(
    () => goals.filter((goal) => selectedGoalIds.includes(goal.id)),
    [goals, selectedGoalIds]
  );

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus("PLANNED");
    setPriority("MEDIUM");
    setStartDate("");
    setDueDate("");
    setSelectedGoalIds([]);
    setGoalDropdownOpen(false);
    setEditingProject(null);
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(project) {
    const linkedGoals = getProjectGoals(project);

    setEditingProject(project);
    setTitle(project.title || "");
    setDescription(project.description || "");
    setStatus(project.status || "PLANNED");
    setPriority(project.priority || "MEDIUM");
    setStartDate(toDateInput(project.startDate));
    setDueDate(toDateInput(project.dueDate));
    setSelectedGoalIds(linkedGoals.map((goal) => goal.id));
    setGoalDropdownOpen(false);
    setModalOpen(true);
  }

  function toggleGoal(goalId) {
    setSelectedGoalIds((current) =>
      current.includes(goalId)
        ? current.filter((id) => id !== goalId)
        : [...current, goalId]
    );
  }

  function removeGoal(goalId) {
    setSelectedGoalIds((current) =>
      current.filter((id) => id !== goalId)
    );
  }

  async function saveProject(event) {
    event.preventDefault();

    if (!title.trim()) return;

    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      startDate: startDate || null,
      dueDate: dueDate || null,
      goalIds: selectedGoalIds,
    };

    try {
      const response = await fetch(
        editingProject
          ? `/api/projects/${editingProject.id}`
          : "/api/projects",
        {
          method: editingProject ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save the project.");
      }

      setModalOpen(false);
      resetForm();
      await loadProjects();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(project) {
    if (
      !confirm(
        `Delete "${project.title}"? This will also delete its project milestones and tasks.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not delete the project.");
      }

      await loadProjects();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 text-[#51464B] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B18A9D]">
              Make things happen
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#51464B] sm:text-4xl">
              Projects
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#95888D]">
              Turn your goals into meaningful projects, organize the steps, and
              see your progress along the way.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B78AA0] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#A77B91]"
          >
            <Plus size={17} />
            New project
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total projects"
            value={stats.total}
            icon={<FolderKanban size={18} />}
            tone="pink"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={<Clock3 size={18} />}
            tone="sage"
          />
          <StatCard
            label="Planned"
            value={stats.planned}
            icon={<Target size={18} />}
            tone="purple"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={<ListTodo size={18} />}
            tone="beige"
          />
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#AD9BA2]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects or goals..."
              className={`${inputClass} pl-10`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUSES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatusFilter(item.value)}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  statusFilter === item.value
                    ? "bg-[#B78AA0] text-white"
                    : "border border-[#EDE2E3] bg-white text-[#95858D] hover:bg-[#F8F1F3]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-[#F0D7D9] bg-[#FFF3F3] p-4 text-sm text-[#A45F68]">
            {error}
            <button
              type="button"
              onClick={loadProjects}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-3xl border border-[#EFE5E4] bg-white"
              />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="mt-7 rounded-3xl border border-dashed border-[#E8DADB] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8EEF2] text-[#B78AA0]">
              <FolderKanban size={26} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-[#62535A]">
              {search || statusFilter !== "ALL"
                ? "No matching projects"
                : "Your project space is waiting"}
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#A29499]">
              {search || statusFilter !== "ALL"
                ? "Try changing your search or filter."
                : "Create your first project to start organizing tasks, milestones, and progress."}
            </p>

            {!search && statusFilter === "ALL" && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B78AA0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A77B91]"
              >
                <Plus size={16} />
                Create a project
              </button>
            )}
          </div>
        ) : (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => openEditModal(project)}
                onDelete={() => deleteProject(project)}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#33252D]/35 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={saveProject}
            className="my-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#EFE3E5] bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#594A51]">
                  {editingProject ? "Edit project" : "Create a project"}
                </h2>
                <p className="mt-1 text-xs text-[#A29499]">
                  Give this project a clear name and direction.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="rounded-full p-2 text-[#A18F95] hover:bg-[#F7F0F1]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <FormField label="Project name">
                <input
                  required
                  autoFocus
                  maxLength={200}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Launch my portfolio website"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  rows={3}
                  maxLength={5000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What do you want to accomplish?"
                  className={inputClass}
                />
              </FormField>

              {/* Goals multi-select dropdown */}
              <div ref={goalDropdownRef}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#88777F]">
                    Connected goals
                  </span>
                  <span className="text-[11px] text-[#A29499]">
                    {selectedGoalIds.length} selected
                  </span>
                </div>

                {goals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E8DADB] bg-[#FDFBFA] p-4 text-center">
                    <Target
                      size={20}
                      className="mx-auto text-[#B18A9D]"
                    />
                    <p className="mt-2 text-xs font-medium text-[#88777F]">
                      No available goals yet
                    </p>
                    <p className="mt-1 text-[11px] text-[#A29499]">
                      Create a goal first, then you can connect it to this
                      project.
                    </p>
                    <Link
                      href="/goals"
                      className="mt-2 inline-block text-xs font-semibold text-[#A77B91] hover:underline"
                    >
                      Go to Goals
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <button
                        type="button"
                        aria-expanded={goalDropdownOpen}
                        onClick={() =>
                          setGoalDropdownOpen((current) => !current)
                        }
                        className={`${inputClass} flex items-center justify-between gap-3 text-left`}
                      >
                        <span
                          className={
                            selectedGoalIds.length
                              ? "text-[#594A51]"
                              : "text-[#B7A9AE]"
                          }
                        >
                          {selectedGoalIds.length
                            ? `${selectedGoalIds.length} goal${selectedGoalIds.length === 1 ? "" : "s"} selected`
                            : "Choose goals to connect"}
                        </span>

                        <ChevronDown
                          size={17}
                          className={`shrink-0 text-[#A18D96] transition-transform ${
                            goalDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {goalDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#EDE2E3] bg-white p-2 shadow-xl">
                          {goals.map((goal) => {
                            const selected = selectedGoalIds.includes(
                              goal.id
                            );

                            return (
                              <button
                                key={goal.id}
                                type="button"
                                onClick={() => toggleGoal(goal.id)}
                                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                                  selected
                                    ? "border-[#C9A5B5] bg-[#F9EFF3]"
                                    : "border-transparent bg-white hover:border-[#E8DADB] hover:bg-[#FDFBFA]"
                                }`}
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                    selected
                                      ? "border-[#B78AA0] bg-[#B78AA0] text-white"
                                      : "border-[#DCCDD2] bg-white text-transparent"
                                  }`}
                                >
                                  <Check size={13} strokeWidth={3} />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-semibold text-[#62535A]">
                                    {goal.title}
                                  </span>
                                  <span className="mt-0.5 block text-[10px] text-[#A29499]">
                                    {goal.status === "COMPLETED"
                                      ? "Completed goal"
                                      : "Active goal"}
                                    {goal.targetDate
                                      ? ` · Target ${formatDate(goal.targetDate)}`
                                      : ""}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedGoals.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedGoals.map((goal) => (
                          <span
                            key={goal.id}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#E8D9E7] bg-[#F7F2F8] py-1.5 pl-2.5 pr-1.5 text-[11px] font-medium text-[#897394]"
                          >
                            <span className="max-w-[220px] truncate">
                              {goal.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeGoal(goal.id)}
                              title={`Remove ${goal.title}`}
                              aria-label={`Remove ${goal.title}`}
                              className="rounded-md p-0.5 transition hover:bg-[#EDE3F0] hover:text-[#755D80]"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <p className="mt-2 text-[10px] leading-4 text-[#A29499]">
                  A project can support more than one goal. You can also leave
                  this empty if the project is independent.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Status">
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className={inputClass}
                  >
                    {STATUSES.filter((item) => item.value !== "ALL").map(
                      (item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                <FormField label="Priority">
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className={inputClass}
                  >
                    {PRIORITIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Start date">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Due date">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#9A858F] hover:bg-[#F8F2F3]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#B78AA0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A77B91] disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingProject
                    ? "Save changes"
                    : "Create project"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, icon, tone }) {
  const tones = {
    pink: "bg-[#FBF1F4] text-[#A77D91]",
    sage: "bg-[#F0F4ED] text-[#82927A]",
    purple: "bg-[#F3EFF6] text-[#9685A0]",
    beige: "bg-[#F8F2E8] text-[#A58B65]",
  };

  return (
    <div className="rounded-2xl border border-[#EFE5E4] bg-white p-4 shadow-[0_3px_12px_rgba(100,70,80,0.025)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#9B8D92]">{label}</p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-[#594A51]">{value}</p>
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete }) {
  const progress = getProjectProgress(project);
  const taskCount = getTaskCount(project);
  const completedCount = getCompletedTaskCount(project);
  const dueDate = formatDate(project.dueDate);
  const linkedGoals = getProjectGoals(project);

  return (
    <article className="group rounded-3xl border border-[#EFE5E4] bg-white p-5 shadow-[0_4px_16px_rgba(100,70,80,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(100,70,80,0.07)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8EEF2] text-[#B18A9D]">
            <FolderKanban size={21} />
          </div>

          <div className="min-w-0">
            <Link
              href={`/projects/${project.id}`}
              className="block truncate text-base font-semibold text-[#594A51] transition hover:text-[#A77B91]"
            >
              {project.title}
            </Link>
            <p className="mt-1 text-[11px] text-[#A29499]">
              {project.status === "COMPLETED"
                ? "Finished project"
                : project.status === "ARCHIVED"
                  ? "Archived project"
                  : "Project workspace"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Edit project"
            className="rounded-lg p-2 text-[#A18D96] transition hover:bg-[#F7F0F2] hover:text-[#896779]"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete project"
            className="rounded-lg p-2 text-[#B98A91] transition hover:bg-[#F9EBEC]"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <p className="mt-4 min-h-10 text-sm leading-5 text-[#95888D]">
        {project.description || "No description added yet."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={project.status} />
        <PriorityBadge priority={project.priority} />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#95818B]">
          <Target size={13} />
          Connected goals
        </div>

        {linkedGoals.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {linkedGoals.map((goal) => (
              <Link
                key={goal.id}
                href={`/goals/${goal.id}`}
                className="max-w-full truncate rounded-lg border border-[#EDE3EF] bg-[#F7F2F8] px-2.5 py-1.5 text-[11px] font-medium text-[#897394] transition hover:border-[#CDBBD5] hover:bg-[#F1EAF4]"
                title={goal.title}
              >
                {goal.title}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#B1A3A8]">
            No goals connected
          </p>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#8F7D85]">Progress</span>
          <span className="font-semibold text-[#927488]">{progress}%</span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F0E9E9]">
          <div
            className="h-full rounded-full bg-[#B98BA0] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F2EAEA] pt-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#A29499]">
          <span className="flex items-center gap-1.5">
            <ListTodo size={14} />
            {completedCount}/{taskCount} tasks
          </span>

          {dueDate && (
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              {dueDate}
            </span>
          )}
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A77B91] transition hover:text-[#875D73]"
        >
          Open project
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}
