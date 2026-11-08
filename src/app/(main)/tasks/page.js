"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  CalendarDays,
  Check,
  Circle,
  CircleCheck,
  Clock3,
  Flag,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Layers3,
  AlertCircle,
  FolderKanban,
  CalendarClock,
  RotateCcw,
} from "lucide-react";

const FILTERS = [
  { id: "ALL", label: "All tasks" },
  { id: "TODAY", label: "Today" },
  { id: "UPCOMING", label: "Upcoming" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "DONE", label: "Completed" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "#8A9C83" },
  { value: "MEDIUM", label: "Medium", color: "#B49A73" },
  { value: "HIGH", label: "High", color: "#C77F91" },
  { value: "URGENT", label: "Urgent", color: "#B85B6D" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  projectId: "",
  milestoneId: "",
};
function getTodayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function getDueLabel(value) {
  if (!value) return null;

  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const difference = Math.round(
    (dueDay.getTime() - today.getTime()) / 86400000,
  );

  if (difference < 0) {
    return {
      text: `${Math.abs(difference)}d overdue`,
      color: "#B85B6D",
    };
  }

  if (difference === 0) {
    return { text: "Today", color: "#B47C96" };
  }

  if (difference === 1) {
    return { text: "Tomorrow", color: "#B49A73" };
  }

  return { text: formatDate(value), color: "#8A8290" };
}

function getPriority(value) {
  return PRIORITIES.find((item) => item.value === value) || PRIORITIES[1];
}

function isToday(value) {
  if (!value) return false;
  return new Date(value).toDateString() === new Date().toDateString();
}

function isUpcoming(value) {
  if (!value) return false;

  const due = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due > today;
}

function TaskModal({
  open,
  onClose,
  onSave,
  initialTask,
  parentTask,
  saving,
  projects = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [milestones, setMilestones] = useState([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (initialTask) {
      setForm({
        title: initialTask.title || "",
        description: initialTask.description || "",
        priority: initialTask.priority || "MEDIUM",
        dueDate: initialTask.dueDate
          ? new Date(initialTask.dueDate).toISOString().slice(0, 10)
          : "",
        projectId: initialTask.projectId || "",
        milestoneId: initialTask.milestoneId || "",
      });
    } else if (parentTask) {
      setForm({
        ...EMPTY_FORM,
        projectId: parentTask.projectId || "",
        milestoneId: parentTask.milestoneId || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setError("");
  }, [open, initialTask, parentTask]);

  useEffect(() => {
    if (!open || !form.projectId) {
      setMilestones([]);
      return;
    }

    let cancelled = false;

    async function loadMilestones() {
      setLoadingMilestones(true);

      try {
        const response = await fetch(
          `/api/projects/${form.projectId}/milestones`,
          { cache: "no-store" },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load milestones.");
        }

        if (!cancelled) {
          setMilestones(data.milestones || []);
        }
      } catch (err) {
        if (!cancelled) {
          setMilestones([]);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingMilestones(false);
        }
      }
    }

    loadMilestones();

    return () => {
      cancelled = true;
    };
  }, [open, form.projectId]);

  if (!open) return null;

  const isSubtask = Boolean(parentTask || initialTask?.parentId);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Give your task a title first.");
      return;
    }

    setError("");

    const result = await onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      dueDate: form.dueDate || null,
      projectId: form.projectId || null,
      milestoneId: form.milestoneId || null,
    });

    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#29212b]/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#eee3e8] bg-[#fffdfd] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#f0e7eb] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B47C96]">
              {isSubtask ? "Subtask" : "Your task"}
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[#443744]">
              {initialTask
                ? "Edit task"
                : parentTask
                  ? "Add a subtask"
                  : "Create a task"}
            </h2>

            {parentTask && (
              <p className="mt-1 text-xs text-[#948794]">
                Under: {parentTask.title}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#998b98] transition hover:bg-[#f8eef2] hover:text-[#74586b]"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#5e4e5d]">
              Task title
            </label>

            <input
              autoFocus
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              maxLength={200}
              placeholder="What needs to get done?"
              className="w-full rounded-xl border border-[#eadfe5] bg-white px-4 py-3 text-sm text-[#493d49] outline-none transition placeholder:text-[#b7aab5] focus:border-[#c995ad] focus:ring-2 focus:ring-[#f4e5ec]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#5e4e5d]">
              Description{" "}
              <span className="font-normal text-[#b5a8b3]">(optional)</span>
            </label>

            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              maxLength={5000}
              placeholder="Add a little more detail..."
              className="w-full resize-none rounded-xl border border-[#eadfe5] bg-white px-4 py-3 text-sm text-[#493d49] outline-none transition placeholder:text-[#b7aab5] focus:border-[#c995ad] focus:ring-2 focus:ring-[#f4e5ec]"
            />
          </div>

          {!isSubtask && (
            <div className="space-y-4 rounded-2xl border border-[#f0e5eb] bg-[#fdf9fb] p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#5e4e5d]">
                  Project
                  <span className="ml-1 font-normal text-[#b5a8b3]">
                    (optional)
                  </span>
                </label>

                <select
                  value={form.projectId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      projectId: event.target.value,
                      milestoneId: "",
                    }))
                  }
                  className="w-full rounded-xl border border-[#eadfe5] bg-white px-3 py-3 text-sm text-[#493d49] outline-none focus:border-[#c995ad]"
                >
                  <option value="">No project — standalone task</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              {form.projectId && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#5e4e5d]">
                    Milestone
                    <span className="ml-1 font-normal text-[#b5a8b3]">
                      (optional)
                    </span>
                  </label>

                  <select
                    value={form.milestoneId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        milestoneId: event.target.value,
                      }))
                    }
                    disabled={loadingMilestones}
                    className="w-full rounded-xl border border-[#eadfe5] bg-white px-3 py-3 text-sm text-[#493d49] outline-none focus:border-[#c995ad] disabled:opacity-60"
                  >
                    <option value="">
                      {loadingMilestones
                        ? "Loading milestones..."
                        : "No milestone"}
                    </option>

                    {milestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {isSubtask && (
            <div className="rounded-xl bg-[#f8f2f5] px-4 py-3 text-xs text-[#927b8b]">
              This subtask will stay under its parent task and inherit its
              project and milestone.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#5e4e5d]">
                Priority
              </label>

              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#eadfe5] bg-white px-3 py-3 text-sm text-[#493d49] outline-none focus:border-[#c995ad]"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#5e4e5d]">
                Due date
              </label>

              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#eadfe5] bg-white px-3 py-3 text-sm text-[#493d49] outline-none focus:border-[#c995ad]"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-[#fff0f0] px-4 py-3 text-sm text-[#a94f5b]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-[#f0e7eb] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-[#867887] transition hover:bg-[#f8f1f4]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#B47C96] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9e6882] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : initialTask
                  ? "Save changes"
                  : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(
    (subtask) => subtask.status === "DONE",
  ).length;

  const priority = getPriority(task.priority);
  const dueLabel = getDueLabel(task.dueDate);
  const done = task.status === "DONE";

  return (
    <div
      className={`group rounded-2xl border transition ${
        done
          ? "border-[#eee8ec] bg-[#fcfafb]"
          : "border-[#eee4e9] bg-white hover:border-[#dfc6d2] hover:shadow-[0_5px_18px_rgba(100,70,90,0.05)]"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 shrink-0 transition ${
            done ? "text-[#9aaf91]" : "text-[#c5a3b3] hover:text-[#B47C96]"
          }`}
          aria-label={done ? "Mark as incomplete" : "Complete task"}
        >
          {done ? <CircleCheck size={21} /> : <Circle size={21} />}
        </button>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => setExpanded((current) => !current)}
            className="block max-w-full text-left"
          >
            <span
              className={`text-sm font-semibold ${
                done ? "text-[#a69ba5] line-through" : "text-[#4d414e]"
              }`}
            >
              {task.title}
            </span>
          </button>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#978b98]">
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium"
              style={{ color: priority.color }}
            >
              <Flag size={12} />
              {priority.label}
            </span>

            {dueLabel && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-medium"
                style={{ color: dueLabel.color }}
              >
                <CalendarDays size={12} />
                {dueLabel.text}
              </span>
            )}

            {task.project && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#8e8290]">
                <FolderKanban size={12} />
                {task.project.title}
              </span>
            )}

            {task.milestone && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[#8e8290]">
                <Layers3 size={12} />
                {task.milestone.title}
              </span>
            )}

            {subtasks.length > 0 && (
              <button
                onClick={() => setExpanded((current) => !current)}
                className="inline-flex items-center gap-1 text-[11px] text-[#a08094] transition hover:text-[#805b71]"
              >
                <ListTodo size={12} />
                {completedSubtasks}/{subtasks.length} subtasks
                {expanded ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="relative flex shrink-0 items-center gap-1">
          <button
            onClick={() => onAddSubtask(task)}
            title="Add subtask"
            className="rounded-lg p-2 text-[#a996a5] opacity-0 transition hover:bg-[#f8edf2] hover:text-[#9b6e85] group-hover:opacity-100 focus:opacity-100"
          >
            <Plus size={16} />
          </button>

          <button
            onClick={() => setMenuOpen((current) => !current)}
            className="rounded-lg p-2 text-[#a996a5] transition hover:bg-[#f8edf2] hover:text-[#9b6e85]"
            aria-label="Task options"
          >
            <MoreHorizontal size={17} />
          </button>

          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              />
              <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-[#eee2e8] bg-white p-1.5 shadow-xl">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(task);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[#685968] hover:bg-[#faf2f5]"
                >
                  <Pencil size={13} /> Edit task
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAddSubtask(task);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[#685968] hover:bg-[#faf2f5]"
                >
                  <Plus size={13} /> Add subtask
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(task);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[#b45e6d] hover:bg-[#fff2f2]"
                >
                  <Trash2 size={13} /> Delete task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {expanded && subtasks.length > 0 && (
        <div className="mx-4 mb-4 ml-10 space-y-2 border-l-2 border-[#f0e3e9] pl-4">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 rounded-xl bg-[#fcf9fb] px-3 py-2.5"
            >
              <button
                onClick={() => onToggleSubtask(subtask)}
                className={
                  subtask.status === "DONE"
                    ? "text-[#9aaf91]"
                    : "text-[#c5a3b3]"
                }
                aria-label="Toggle subtask"
              >
                {subtask.status === "DONE" ? (
                  <CircleCheck size={16} />
                ) : (
                  <Circle size={16} />
                )}
              </button>

              <span
                className={`min-w-0 flex-1 text-xs ${
                  subtask.status === "DONE"
                    ? "text-[#aaa0a9] line-through"
                    : "text-[#655765]"
                }`}
              >
                {subtask.title}
              </span>

              <button
                onClick={() => onEditSubtask(subtask)}
                className="rounded-md p-1.5 text-[#a996a5] hover:bg-[#f5eaf0]"
                title="Edit subtask"
              >
                <Pencil size={12} />
              </button>

              <button
                onClick={() => onDeleteSubtask(subtask)}
                className="rounded-md p-1.5 text-[#b9828c] hover:bg-[#fff0f0]"
                title="Delete subtask"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {expanded && subtasks.length === 0 && (
        <div className="mx-4 mb-4 ml-10 border-l-2 border-[#f0e3e9] pl-4">
          <p className="py-2 text-xs text-[#a99ba7]">No subtasks yet.</p>
          <button
            onClick={() => onAddSubtask(task)}
            className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#B47C96] hover:text-[#925c76]"
          >
            <Plus size={13} /> Add your first subtask
          </button>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [parentTask, setParentTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load projects.");
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Load projects error:", err);
    }
  }, []);
  const loadTasks = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/tasks?parentId=none", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("We couldn't load your tasks.");
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, [loadTasks, loadProjects]);

  const allTasks = useMemo(
    () => tasks.flatMap((task) => [task, ...(task.subtasks || [])]),
    [tasks],
  );

  const stats = useMemo(() => {
    const today = allTasks.filter(
      (task) => task.status !== "DONE" && isToday(task.dueDate),
    ).length;

    const completed = allTasks.filter((task) => task.status === "DONE").length;

    const inProgress = allTasks.filter(
      (task) => task.status === "IN_PROGRESS",
    ).length;

    const overdue = allTasks.filter((task) => {
      if (!task.dueDate || task.status === "DONE") return false;

      const due = new Date(task.dueDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);

      return due < now;
    }).length;

    return {
      total: allTasks.length,
      today,
      completed,
      inProgress,
      overdue,
    };
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks
      .map((task) => {
        const matchesQuery =
          !query ||
          task.title.toLowerCase().includes(query) ||
          (task.description || "").toLowerCase().includes(query) ||
          (task.project?.title || "").toLowerCase().includes(query);

        const matchingSubtasks = (task.subtasks || []).filter((subtask) => {
          return !query || subtask.title.toLowerCase().includes(query);
        });

        let matchesFilter = true;

        if (activeFilter === "TODAY") {
          matchesFilter = task.status !== "DONE" && isToday(task.dueDate);
        } else if (activeFilter === "UPCOMING") {
          matchesFilter = task.status !== "DONE" && isUpcoming(task.dueDate);
        } else if (activeFilter === "IN_PROGRESS") {
          matchesFilter = task.status === "IN_PROGRESS";
        } else if (activeFilter === "DONE") {
          matchesFilter = task.status === "DONE";
        }

        const matchingSubtaskFilter = (task.subtasks || []).filter(
          (subtask) => {
            if (activeFilter === "TODAY") {
              return subtask.status !== "DONE" && isToday(subtask.dueDate);
            }

            if (activeFilter === "UPCOMING") {
              return subtask.status !== "DONE" && isUpcoming(subtask.dueDate);
            }

            if (activeFilter === "IN_PROGRESS") {
              return subtask.status === "IN_PROGRESS";
            }

            if (activeFilter === "DONE") {
              return subtask.status === "DONE";
            }

            return true;
          },
        );

        if (query && !matchesQuery && matchingSubtasks.length === 0) {
          return null;
        }

        if (!matchesFilter && matchingSubtaskFilter.length === 0) {
          return null;
        }

        return {
          ...task,
          subtasks: query ? matchingSubtasks : matchingSubtaskFilter,
        };
      })
      .filter(Boolean);
  }, [tasks, search, activeFilter]);

  function openCreateModal(parent = null) {
    setEditingTask(null);
    setParentTask(parent);
    setModalOpen(true);
  }

  function openEditModal(task, parent = null) {
    setEditingTask(task);
    setParentTask(parent);
    setModalOpen(true);
  }

  // Update an existing task without fetching the entire task list.
  function updateTaskInList(updatedTask) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id === updatedTask.id) {
          return {
            ...task,
            ...updatedTask,
            subtasks: updatedTask.subtasks ?? task.subtasks,
          };
        }

        return {
          ...task,
          subtasks: (task.subtasks || []).map((subtask) =>
            subtask.id === updatedTask.id
              ? { ...subtask, ...updatedTask }
              : subtask,
          ),
        };
      }),
    );
  }

  // Add a new task either to the  list or under its parent.
  function addTaskToList(newTask, parentId = null) {
    setTasks((current) => {
      if (!parentId) {
        return [...current, newTask];
      }

      return current.map((task) =>
        task.id === parentId
          ? {
              ...task,
              subtasks: [...(task.subtasks || []), newTask],
            }
          : task,
      );
    });
  }

  // Remove a task and preserve its children as standalone tasks.
  function removeTaskFromList(taskToRemove) {
    setTasks((current) => {
      const isMainTask = current.some((task) => task.id === taskToRemove.id);

      if (isMainTask) {
        const remaining = current.filter((task) => task.id !== taskToRemove.id);

        const detachedSubtasks = (taskToRemove.subtasks || []).map(
          (subtask) => ({
            ...subtask,
            parentId: null,
          }),
        );

        return [...remaining, ...detachedSubtasks];
      }

      const remaining = current.map((task) => ({
        ...task,
        subtasks: (task.subtasks || []).filter(
          (subtask) => subtask.id !== taskToRemove.id,
        ),
      }));

      const detachedSubtasks = (taskToRemove.subtasks || []).map((subtask) => ({
        ...subtask,
        parentId: null,
      }));

      return [...remaining, ...detachedSubtasks];
    });
  }

  async function saveTask(values) {
    setSaving(true);

    try {
      const isEditing = Boolean(editingTask);

      const url = isEditing ? `/api/tasks/${editingTask.id}` : "/api/tasks";

      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        ...values,
        ...(parentTask && !isEditing
          ? {
              parentId: parentTask.id,
              projectId: parentTask.projectId || null,
              milestoneId: parentTask.milestoneId || null,
            }
          : {
              projectId: values.projectId || null,
              milestoneId: values.milestoneId || null,
            }),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || "Unable to save task.",
        };
      }

      // Support either a direct task response or { task: ... }.
      const savedTask = data.task || data;

      if (isEditing) {
        updateTaskInList(savedTask);
      } else {
        addTaskToList(savedTask, parentTask?.id || null);
      }

      setModalOpen(false);
      setEditingTask(null);
      setParentTask(null);

      return { success: true };
    } catch (error) {
      console.error("Save task error:", error);

      return {
        error: "Something went wrong while saving.",
      };
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    const previousTasks = tasks;

    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";

    // Update the interface immediately.
    updateTaskInList({
      ...task,
      status: nextStatus,
      completedAt: nextStatus === "DONE" ? new Date().toISOString() : null,
    });

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Unable to update this task.");
      }
    } catch (error) {
      // Restore the previous state if saving fails.
      setTasks(previousTasks);
      setError(error.message || "Unable to update this task.");
    }
  }

  async function deleteTask(task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"? Its subtasks will re as standalone tasks.`,
    );

    if (!confirmed) return;

    const previousTasks = tasks;

    // Remove immediately.
    removeTaskFromList(task);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete this task.");
      }
    } catch (error) {
      // Restore the list if deletion fails.
      setTasks(previousTasks);
      setError(error.message || "Unable to delete this task.");
    }
  }

  function handleDeleteSubtask(subtask) {
    deleteTask(subtask);
  }

  return (
    <>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B47C96]">
                Your little steps
              </p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-[#493b4a] sm:text-3xl">
                Tasks
              </h1>
            </div>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B47C96] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9e6882]"
          >
            <Plus size={17} />
            New task
          </button>
        </div>

        <section className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#eee3e9] bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#958796]">All tasks</span>
              <ListTodo size={17} className="text-[#B47C96]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[#514352]">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-[#eee3e9] bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#958796]">Due today</span>
              <CalendarDays size={17} className="text-[#B47C96]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[#514352]">
              {stats.today}
            </p>
          </div>

          <div className="rounded-2xl border border-[#eee3e9] bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#958796]">In progress</span>
              <Clock3 size={17} className="text-[#B49A73]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[#514352]">
              {stats.inProgress}
            </p>
          </div>

          <div className="rounded-2xl border border-[#eee3e9] bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#958796]">Completed</span>
              <CircleCheck size={17} className="text-[#91a789]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[#514352]">
              {stats.completed}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-[#eee3e9] bg-white p-4 shadow-[0_8px_30px_rgba(90,65,85,0.035)] sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#514352]">
                Your task list
              </h2>
              <p className="mt-1 text-xs text-[#a092a0]">
                A little progress is still progress.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ad9eac]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                className="w-full rounded-xl border border-[#eee4e9] bg-[#fdfafb] py-2.5 pl-9 pr-3 text-xs text-[#514352] outline-none transition placeholder:text-[#b8acb7] focus:border-[#d5afc1]"
              />
            </div>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto border-b border-[#f0e8ec] pb-3">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeFilter === filter.id
                    ? "bg-[#f3e5ec] text-[#9c6681]"
                    : "text-[#998b99] hover:bg-[#faf5f7] hover:text-[#705a6e]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#fff1f1] px-4 py-3 text-xs text-[#a9515e]">
              <AlertCircle size={15} />
              {error}
              <button
                onClick={() => setError("")}
                className="ml-auto"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3 py-5">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl bg-[#f8f2f5]"
                />
              ))}
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onEdit={(item) => openEditModal(item)}
                  onDelete={deleteTask}
                  onAddSubtask={openCreateModal}
                  onToggleSubtask={toggleTask}
                  onEditSubtask={(item) => openEditModal(item)}
                  onDeleteSubtask={handleDeleteSubtask}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#eadde5] bg-[#fdfafb] px-5 py-14 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5e9ef] text-[#B47C96]">
                <ListTodo size={25} />
              </div>

              <h3 className="text-sm font-semibold text-[#5b4b5b]">
                {search
                  ? "No matching tasks"
                  : activeFilter === "DONE"
                    ? "Nothing completed yet"
                    : activeFilter === "TODAY"
                      ? "Nothing due today"
                      : activeFilter === "UPCOMING"
                        ? "No upcoming tasks"
                        : "Your task list is empty"}
              </h3>

              <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#a092a0]">
                {search
                  ? "Try another search term."
                  : "Add a task when something needs your attention. You can start with one small step."}
              </p>

              {!search && activeFilter === "ALL" && (
                <button
                  onClick={() => openCreateModal()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B47C96] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#9e6882]"
                >
                  <Plus size={15} />
                  Create your first task
                </button>
              )}
            </div>
          )}
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-[11px] text-[#a89aa7]">
            {stats.overdue > 0
              ? `${stats.overdue} task${stats.overdue === 1 ? "" : "s"} overdue. You can adjust their dates whenever you need.`
              : "Your plans can change. Your task list can change with them."}
          </p>

          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a07891] transition hover:text-[#80576f]"
          >
            <FolderKanban size={14} />
            View projects
          </Link>
        </div>
      

      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
          setParentTask(null);
        }}
        onSave={saveTask}
        initialTask={editingTask}
        parentTask={parentTask}
        saving={saving}
        projects={projects}
      />
    </>
  );
}
