
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Check,
  Circle,
  CircleCheck,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Layers3,
  ListTodo,
  Pencil,
  Trash2,
  X,
  Flag,
  FolderKanban,
} from "lucide-react";

const priorities = [
  { value: "LOW", label: "Low", color: "#8A9C83" },
  { value: "MEDIUM", label: "Medium", color: "#B49A73" },
  { value: "HIGH", label: "High", color: "#C77F91" },
  { value: "URGENT", label: "Urgent", color: "#B85B6D" },
];

function dateLabel(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear()
      ? "numeric"
      : undefined,
  });
}

function TaskForm({ onSave, onCancel, initialTask, saving }) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(
    initialTask?.description || ""
  );
  const [priority, setPriority] = useState(
    initialTask?.priority || "MEDIUM"
  );
  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate
      ? new Date(initialTask.dueDate).toISOString().slice(0, 10)
      : ""
  );
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Enter a task title.");
      return;
    }

    const result = await onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || null,
    });

    if (result?.error) setError(result.error);
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-[#eadde5] bg-[#fdf9fb] p-4"
    >
      <input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Task title"
        maxLength={200}
        className="w-full rounded-xl border border-[#eadfe5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c995ad]"
      />

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description (optional)"
        rows={2}
        maxLength={5000}
        className="w-full resize-none rounded-xl border border-[#eadfe5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c995ad]"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="rounded-xl border border-[#eadfe5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c995ad]"
        >
          {priorities.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label} priority
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="rounded-xl border border-[#eadfe5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c995ad]"
        />
      </div>

      {error && <p className="text-xs text-[#b45e6d]">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-xs font-medium text-[#8d7d8c] hover:bg-[#f5edf1]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#B47C96] px-4 py-2 text-xs font-semibold text-white hover:bg-[#9e6882] disabled:opacity-60"
        >
          {saving ? "Saving..." : initialTask ? "Save changes" : "Add task"}
        </button>
      </div>
    </form>
  );
}

function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const priority =
    priorities.find((item) => item.value === task.priority) || priorities[1];

  const [expanded, setExpanded] = useState(false);
  const subtasks = task.subtasks || [];
  const completed = subtasks.filter((item) => item.status === "DONE").length;

  return (
    <div className="rounded-xl border border-[#f0e7ec] bg-white">
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={() => onToggle(task)}
          aria-label="Toggle task completion"
          className={`mt-0.5 ${
            task.status === "DONE"
              ? "text-[#91a789]"
              : "text-[#c5a3b3] hover:text-[#B47C96]"
          }`}
        >
          {task.status === "DONE"
            ? <CircleCheck size={19} />
            : <Circle size={19} />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${
            task.status === "DONE"
              ? "text-[#a69ba5] line-through"
              : "text-[#514352]"
          }`}>
            {task.title}
          </p>

          {task.description && (
            <p className="mt-1 text-xs leading-relaxed text-[#988b98]">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: priority.color }}
            >
              <Flag size={11} />
              {priority.label}
            </span>

            {task.dueDate && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#988b98]">
                <CalendarDays size={11} />
                {dateLabel(task.dueDate)}
              </span>
            )}

            {subtasks.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-[11px] text-[#a07891]"
              >
                <ListTodo size={12} />
                {completed}/{subtasks.length}
                {expanded
                  ? <ChevronDown size={12} />
                  : <ChevronRight size={12} />}
              </button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            title="Edit task"
            className="rounded-lg p-2 text-[#a996a5] hover:bg-[#f8edf2]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(task)}
            title="Delete task"
            className="rounded-lg p-2 text-[#b9828c] hover:bg-[#fff0f0]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-[#f1e9ed] bg-[#fdfafb] p-3 pl-10">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2">
              <span className={
                subtask.status === "DONE"
                  ? "text-[#91a789]"
                  : "text-[#c5a3b3]"
              }>
                {subtask.status === "DONE"
                  ? <CircleCheck size={14} />
                  : <Circle size={14} />}
              </span>
              <span className={`text-xs ${
                subtask.status === "DONE"
                  ? "text-[#aaa0a9] line-through"
                  : "text-[#655765]"
              }`}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectWorkPage() {
  const params = useParams();
  const projectId = params.id;

  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMilestone, setNewMilestone] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");
  const [taskForm, setTaskForm] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId) return;

    try {
      setError("");

      const [milestoneResponse, taskResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}/milestones`, {
          cache: "no-store",
        }),
        fetch(`/api/tasks?projectId=${projectId}&parentId=none`, {
          cache: "no-store",
        }),
      ]);

      if (!milestoneResponse.ok || !taskResponse.ok) {
        throw new Error("Unable to load this project's work.");
      }

      const [milestoneData, taskData] = await Promise.all([
        milestoneResponse.json(),
        taskResponse.json(),
      ]);

      setMilestones(Array.isArray(milestoneData) ? milestoneData : []);
      setTasks(Array.isArray(taskData) ? taskData : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allTasks = [
    ...tasks,
    ...tasks.flatMap((task) => task.subtasks || []),
  ];

  const completedCount = allTasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const progress = allTasks.length
    ? Math.round((completedCount / allTasks.length) * 100)
    : 0;

  async function createMilestone(event) {
    event.preventDefault();

    if (!milestoneTitle.trim()) return;

    setSaving(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/milestones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: milestoneTitle.trim(),
            dueDate: milestoneDate || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to create milestone.");
        return;
      }

      setMilestoneTitle("");
      setMilestoneDate("");
      setNewMilestone(false);
      await loadData();
    } catch {
      setError("Unable to create milestone.");
    } finally {
      setSaving(false);
    }
  }

  async function saveTask(values) {
    setSaving(true);

    try {
      const editing = Boolean(editingTask);

      const response = await fetch(
        editing ? `/api/tasks/${editingTask.id}` : "/api/tasks",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            projectId,
            milestoneId: taskForm?.milestoneId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Unable to save task." };
      }

      setTaskForm(null);
      setEditingTask(null);
      await loadData();

      return { success: true };
    } catch {
      return { error: "Unable to save task." };
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: task.status === "DONE" ? "TODO" : "DONE",
      }),
    });

    if (response.ok) {
      await loadData();
    } else {
      setError("Unable to update task.");
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await loadData();
    } else {
      setError("Unable to delete task.");
    }
  }

  async function toggleMilestone(milestone) {
    const response = await fetch(`/api/milestones/${milestone.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed: !milestone.completedAt,
      }),
    });

    if (response.ok) {
      await loadData();
    } else {
      setError("Unable to update milestone.");
    }
  }

  async function deleteMilestone(milestone) {
    if (!window.confirm(
      `Delete "${milestone.title}"? Its tasks will become standalone tasks.`
    )) return;

    const response = await fetch(`/api/milestones/${milestone.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await loadData();
    } else {
      setError("Unable to delete milestone.");
    }
  }

  return (
    <main className="min-h-screen bg-[#faf7f8] px-4 py-6 text-[#4d414e] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eee3e9] bg-white text-[#8f7c8c] hover:text-[#9e6d85]"
            aria-label="Back to project"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B47C96]">
              Project workspace
            </p>
            <h1 className="text-2xl font-semibold text-[#493b4a]">
              Milestones & Tasks
            </h1>
          </div>
        </header>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl bg-[#fff0f0] px-4 py-3 text-sm text-[#a9515e]">
            {error}
            <button onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}

        <section className="mb-7 rounded-3xl border border-[#eee3e9] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#978a98]">Overall project progress</p>
              <p className="mt-2 text-3xl font-semibold text-[#514352]">
                {progress}%
              </p>
              <p className="mt-1 text-xs text-[#a092a0]">
                {completedCount} of {allTasks.length} tasks completed
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5e9ef] text-[#B47C96]">
              <FolderKanban size={25} />
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#f2eaf0]">
            <div
              className="h-full rounded-full bg-[#B47C96] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {loading ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-3xl bg-[#f3eaf0]" />
            <div className="h-64 animate-pulse rounded-3xl bg-[#f3eaf0]" />
          </div>
        ) : (
          <>
            <section className="mb-7 rounded-3xl border border-[#eee3e9] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers3 size={18} className="text-[#B47C96]" />
                    <h2 className="text-lg font-semibold text-[#514352]">
                      Milestones
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-[#a092a0]">
                    Break your project into meaningful stages.
                  </p>
                </div>

                <button
                  onClick={() => setNewMilestone(!newMilestone)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#f5e9ef] px-3 py-2.5 text-xs font-semibold text-[#9c6681] hover:bg-[#efdee7]"
                >
                  <Plus size={14} />
                  Add milestone
                </button>
              </div>

              {newMilestone && (
                <form
                  onSubmit={createMilestone}
                  className="mb-5 grid gap-3 rounded-2xl border border-[#eadde5] bg-[#fdf9fb] p-4 sm:grid-cols-[1fr_180px_auto]"
                >
                  <input
                    autoFocus
                    value={milestoneTitle}
                    onChange={(event) => setMilestoneTitle(event.target.value)}
                    placeholder="Milestone name"
                    maxLength={200}
                    className="min-w-0 rounded-xl border border-[#eadfe5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c995ad]"
                  />
                  <input
                    type="date"
                    value={milestoneDate}
                    onChange={(event) => setMilestoneDate(event.target.value)}
                    className="rounded-xl border border-[#eadfe5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#c995ad]"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#B47C96] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Create"}
                  </button>
                </form>
              )}

              {milestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#eadde5] bg-[#fdfafb] px-5 py-9 text-center">
                  <Layers3 size={23} className="mx-auto text-[#c5a3b3]" />
                  <p className="mt-3 text-sm font-semibold text-[#655765]">
                    No milestones yet
                  </p>
                  <p className="mt-1 text-xs text-[#a092a0]">
                    Add stages to organize the work in this project.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="rounded-2xl border border-[#f0e7ec] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleMilestone(milestone)}
                          className={`mt-0.5 ${
                            milestone.completedAt
                              ? "text-[#91a789]"
                              : "text-[#c5a3b3]"
                          }`}
                          title="Toggle milestone completion"
                        >
                          {milestone.completedAt
                            ? <CircleCheck size={19} />
                            : <Circle size={19} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold ${
                            milestone.completedAt
                              ? "text-[#a69ba5] line-through"
                              : "text-[#514352]"
                          }`}>
                            {index + 1}. {milestone.title}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-[#9b8d9b]">
                            <span>
                              {milestone.completedTaskCount || 0}/
                              {milestone.taskCount || 0} tasks
                            </span>
                            {milestone.dueDate && (
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays size={11} />
                                {dateLabel(milestone.dueDate)}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f2eaf0]">
                            <div
                              className="h-full rounded-full bg-[#a9b69e]"
                              style={{
                                width: `${milestone.progress || 0}%`,
                              }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => deleteMilestone(milestone)}
                          className="rounded-lg p-2 text-[#b9828c] hover:bg-[#fff0f0]"
                          title="Delete milestone"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          setTaskForm({
                            milestoneId: milestone.id,
                          })
                        }
                        className="ml-8 mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#a07891] hover:text-[#80576f]"
                      >
                        <Plus size={13} />
                        Add task to this milestone
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-[#eee3e9] bg-white p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ListTodo size={18} className="text-[#B47C96]" />
                    <h2 className="text-lg font-semibold text-[#514352]">
                      Project tasks
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-[#a092a0]">
                    All tasks assigned to this project.
                  </p>
                </div>

                <button
                  onClick={() => setTaskForm({ milestoneId: null })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#B47C96] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#9e6882]"
                >
                  <Plus size={14} />
                  Add task
                </button>
              </div>

              {taskForm && (
                <div className="mb-5">
                  <TaskForm
                    onSave={saveTask}
                    onCancel={() => {
                      setTaskForm(null);
                      setEditingTask(null);
                    }}
                    initialTask={editingTask}
                    saving={saving}
                  />
                </div>
              )}

              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#eadde5] bg-[#fdfafb] px-5 py-10 text-center">
                  <ListTodo size={23} className="mx-auto text-[#c5a3b3]" />
                  <p className="mt-3 text-sm font-semibold text-[#655765]">
                    No project tasks yet
                  </p>
                  <p className="mt-1 text-xs text-[#a092a0]">
                    Add your first task or assign one to a milestone.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onEdit={(item) => {
                        setEditingTask(item);
                        setTaskForm({
                          milestoneId: item.milestoneId || null,
                        });
                      }}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
