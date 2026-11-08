
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Circle,
  CircleCheck,
  Clock3,
  FolderKanban,
  ListTodo,
  Target,
  X,
  Milestone as MilestoneIcon,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

const PRIORITY_OPTIONS = [
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
  LOW: "text-[#8A9A86] bg-[#EDF2EA]",
  MEDIUM: "text-[#A47D43] bg-[#F8F0DF]",
  HIGH: "text-[#B87582] bg-[#F8E8EB]",
  URGENT: "text-[#B44F5C] bg-[#F9E2E4]",
};

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

function ProgressBar({ value, color = "bg-[#B98BA0]" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#F0E9E9]">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] || STATUS_STYLES.PLANNED
      }`}
    >
      {STATUS_OPTIONS.find((item) => item.value === status)?.label ||
        status ||
        "Planned"}
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
function updateTaskStatusInTree(items, taskId, status) {
  return (items || []).map((item) => {
    if (item.id === taskId) {
      return { ...item, status };
    }

    if (item.subtasks?.length) {
      return {
        ...item,
        subtasks: updateTaskStatusInTree(
          item.subtasks,
          taskId,
          status
        ),
      };
    }

    return item;
  });
}

function countTasks(items) {
  let total = 0;
  let completed = 0;

  function collect(list) {
    for (const item of list || []) {
      total++;

      if (item.status === "DONE") {
        completed++;
      }

      collect(item.subtasks || []);
    }
  }

  collect(items);

  return { total, completed };
}
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState("");

  const [taskModal, setTaskModal] = useState(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskMilestoneId, setTaskMilestoneId] = useState("");

  const [expandedTasks, setExpandedTasks] = useState({});
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [projectEditing, setProjectEditing] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState("PLANNED");
  const [projectPriority, setProjectPriority] = useState("MEDIUM");
  const [projectDueDate, setProjectDueDate] = useState("");

  // Load project data.
  // Silent refreshes update the data without showing the full-page loader.
  const loadProject = useCallback(
    async ({ silent = false } = {}) => {
      if (!projectId) return;

      if (!silent) {
        setLoading(true);
      }

      setError("");

      try {
        const [
          projectResponse,
          milestoneResponse,
          taskResponse,
        ] = await Promise.all([
          fetch(`/api/projects/${projectId}`, {
            cache: "no-store",
          }),
          fetch(`/api/projects/${projectId}/milestones`, {
            cache: "no-store",
          }),
          fetch(`/api/tasks?projectId=${projectId}&parentId=none`, {
            cache: "no-store",
          }),
        ]);

        async function readResponse(response, endpointName) {
          const text = await response.text();

          if (!text) {
            throw new Error(
              `${endpointName} returned an empty response (HTTP ${response.status}).`
            );
          }

          try {
            return JSON.parse(text);
          } catch {
            throw new Error(
              `${endpointName} returned an invalid response (HTTP ${response.status}).`
            );
          }
        }

        const projectData = await readResponse(
          projectResponse,
          "Project API"
        );

        const milestoneData = await readResponse(
          milestoneResponse,
          "Milestones API"
        );

        const taskData = await readResponse(
          taskResponse,
          "Tasks API"
        );

        if (!projectResponse.ok) {
          throw new Error(
            projectData.error || "Could not load this project."
          );
        }

        if (!milestoneResponse.ok) {
          throw new Error(
            milestoneData.error || "Could not load project milestones."
          );
        }

        if (!taskResponse.ok) {
          throw new Error(
            taskData.error || "Could not load project tasks."
          );
        }

        const loadedProject = projectData.project || projectData;
        const loadedMilestones = milestoneData.milestones || [];
        const loadedTasks = taskData.tasks || [];

        const projectTaskMap = new Map();

        loadedTasks
          .filter((task) => !task.parentId)
          .forEach((task) => {
            projectTaskMap.set(task.id, task);
          });

        loadedMilestones.forEach((milestone) => {
          (milestone.tasks || [])
            .filter((task) => !task.parentId)
            .forEach((task) => {
              projectTaskMap.set(task.id, {
                ...task,
                milestoneId: task.milestoneId || milestone.id,
                milestone: task.milestone || {
                  id: milestone.id,
                  title: milestone.title,
                },
              });
            });
        });

        const combinedTasks = Array.from(
          projectTaskMap.values()
        ).sort(
          (a, b) => (a.position || 0) - (b.position || 0)
        );

        setProject(loadedProject);
        setMilestones(loadedMilestones);
        setTasks(combinedTasks);

        setProjectTitle(loadedProject.title || "");
        setProjectDescription(loadedProject.description || "");
        setProjectStatus(loadedProject.status || "PLANNED");
        setProjectPriority(loadedProject.priority || "MEDIUM");
        setProjectDueDate(toDateInput(loadedProject.dueDate));
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [projectId]
  );

  // Initial page load.
  // Do not use await directly inside useEffect.
  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const allTasks = useMemo(() => {
    const result = [];

    function collect(items) {
      for (const item of items || []) {
        result.push(item);
        collect(item.subtasks || []);
      }
    }

    collect(tasks);
    return result;
  }, [tasks]);

  const completedTasks = allTasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const progress = allTasks.length
    ? Math.round((completedTasks / allTasks.length) * 100)
    : 0;

  const milestoneProgress = useMemo(() => {
    if (!milestones.length) return 0;

    const total = milestones.reduce(
      (sum, milestone) => sum + (milestone.progress || 0),
      0
    );

    return Math.round(total / milestones.length);
  }, [milestones]);

  async function updateProject(updates) {
    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update the project.");
      }

      const updated = data.project || data;

      setProject(updated);
      setProjectTitle(updated.title || "");
      setProjectDescription(updated.description || "");
      setProjectStatus(updated.status || "PLANNED");
      setProjectPriority(updated.priority || "MEDIUM");
      setProjectDueDate(toDateInput(updated.dueDate));
      setProjectEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openNewMilestone() {
    setEditingMilestone(null);
    setMilestoneTitle("");
    setMilestoneDescription("");
    setMilestoneDueDate("");
    setShowMilestoneForm(true);
  }

  function openEditMilestone(milestone) {
    setEditingMilestone(milestone);
    setMilestoneTitle(milestone.title || "");
    setMilestoneDescription(milestone.description || "");
    setMilestoneDueDate(toDateInput(milestone.dueDate));
    setShowMilestoneForm(true);
  }

  async function saveMilestone(event) {
    event.preventDefault();

    if (!milestoneTitle.trim()) return;

    setSaving(true);

    try {
      const url = editingMilestone
        ? `/api/milestones/${editingMilestone.id}`
        : `/api/projects/${projectId}/milestones`;

      const response = await fetch(url, {
        method: editingMilestone ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: milestoneTitle.trim(),
          description: milestoneDescription.trim(),
          dueDate: milestoneDueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save the milestone.");
      }

      setShowMilestoneForm(false);
      await loadProject({ silent: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMilestone(milestone) {
    if (
      !confirm(
        `Delete "${milestone.title}"? Its tasks will re in this project, but will no longer belong to this milestone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/milestones/${milestone.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not delete the milestone.");
      }

      await loadProject({ silent: true });
    } catch (err) {
      alert(err.message);
    }
  }

  function openNewTask(options = {}) {
    setTaskModal({
      mode: "create",
      parent: options.parent || null,
    });

    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("MEDIUM");
    setTaskDueDate("");
    setTaskMilestoneId(options.milestoneId || "");
  }

  function openEditTask(task) {
    setTaskModal({
      mode: "edit",
      task,
    });

    setTaskTitle(task.title || "");
    setTaskDescription(task.description || "");
    setTaskPriority(task.priority || "MEDIUM");
    setTaskDueDate(toDateInput(task.dueDate));
    setTaskMilestoneId(task.milestoneId || "");
  }

  async function saveTask(event) {
    event.preventDefault();

    if (!taskTitle.trim()) return;

    setSaving(true);

    const editing = taskModal?.mode === "edit";
    const task = taskModal?.task;
    const parent = taskModal?.parent;

    const payload = {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      priority: taskPriority,
      dueDate: taskDueDate || null,
      projectId,
      milestoneId: taskMilestoneId || null,
    };

    if (!editing && parent) {
      payload.parentId = parent.id;
      payload.projectId = parent.projectId || projectId;
      payload.milestoneId = parent.milestoneId || null;
    }

    try {
      const response = await fetch(
        editing ? `/api/tasks/${task.id}` : "/api/tasks",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save the task.");
      }

      setTaskModal(null);
      await loadProject({ silent: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

 async function toggleTask(task) {
  const previousStatus = task.status;
  const nextStatus =
    previousStatus === "DONE" ? "TODO" : "DONE";

  // Update the task immediately in the interface.
  setTasks((current) =>
    updateTaskStatusInTree(current, task.id, nextStatus)
  );

  // Update milestone task lists and progress immediately too.
  setMilestones((current) =>
    current.map((milestone) => {
      if (!milestone.tasks?.length) return milestone;

      const updatedTasks = updateTaskStatusInTree(
        milestone.tasks,
        task.id,
        nextStatus
      );

      const counts = countTasks(updatedTasks);

      return {
        ...milestone,
        tasks: updatedTasks,
        taskCount: counts.total,
        completedTaskCount: counts.completed,
        progress: counts.total
          ? Math.round(
              (counts.completed / counts.total) * 100
            )
          : 0,
      };
    })
  );

  // Save in the background.
  try {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: nextStatus,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Could not update the task."
      );
    }
  } catch (err) {
    // Revert only if this click's change is still current.
    setTasks((current) =>
      updateTaskStatusInTree(
        current,
        task.id,
        previousStatus
      )
    );

    setMilestones((current) =>
      current.map((milestone) => {
        if (!milestone.tasks?.length) return milestone;

        const updatedTasks = updateTaskStatusInTree(
          milestone.tasks,
          task.id,
          previousStatus
        );

        const counts = countTasks(updatedTasks);

        return {
          ...milestone,
          tasks: updatedTasks,
          taskCount: counts.total,
          completedTaskCount: counts.completed,
          progress: counts.total
            ? Math.round(
                (counts.completed / counts.total) * 100
              )
            : 0,
        };
      })
    );

    alert(err.message);
  }
}

  async function deleteTask(task) {
    if (!confirm(`Delete "${task.title}"?`)) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not delete the task.");
      }

      await loadProject({ silent: true });
    } catch (err) {
      alert(err.message);
    }
  }

  function toggleExpanded(id) {
    setExpandedTasks((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function toggleMilestoneExpanded(id) {
    setExpandedMilestones((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  function TaskRow({ task, depth = 0 }) {
    const hasSubtasks = task.subtasks?.length > 0;
    const expanded = expandedTasks[task.id];
    const done = task.status === "DONE";

    return (
      <div>
        <div
          className={`group flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-[#FAF6F5] ${
            depth > 0 ? "ml-7 border-l border-[#EDE2E2]" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => toggleTask(task)}
            className="mt-0.5 shrink-0 text-[#B78AA0] transition hover:scale-110"
            aria-label={
              done ? "Mark task incomplete" : "Complete task"
            }
          >
            {done ? (
              <CircleCheck
                size={19}
                className="text-[#8BA58A]"
              />
            ) : (
              <Circle size={19} />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() =>
                hasSubtasks && toggleExpanded(task.id)
              }
              className="flex max-w-full items-center gap-1 text-left"
            >
              {hasSubtasks && (
                <span className="text-[#A99AA0]">
                  {expanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
              )}

              <span
                className={`break-words text-sm font-medium ${
                  done
                    ? "text-[#A69B9D] line-through"
                    : "text-[#51464B]"
                }`}
              >
                {task.title}
              </span>
            </button>

            {task.description && (
              <p className="mt-1 text-xs leading-relaxed text-[#9A8D91]">
                {task.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={task.priority} />

              {task.dueDate && (
                <span className="flex items-center gap-1 text-[11px] text-[#9A8D91]">
                  <CalendarDays size={12} />
                  {formatDate(task.dueDate)}
                </span>
              )}

              {task.milestone?.title && (
                <span className="rounded-full bg-[#F2EDF4] px-2 py-0.5 text-[10px] text-[#88778F]">
                  {task.milestone.title}
                </span>
              )}

              {hasSubtasks && (
                <span className="text-[11px] text-[#A99AA0]">
                  {
                    task.subtasks.filter(
                      (item) => item.status === "DONE"
                    ).length
                  }
                  /{task.subtasks.length} subtasks
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => openNewTask({ parent: task })}
              title="Add subtask"
              className="rounded-lg p-1.5 text-[#9B8491] hover:bg-[#F1E8EC]"
            >
              <Plus size={15} />
            </button>

            <button
              type="button"
              onClick={() => openEditTask(task)}
              title="Edit task"
              className="rounded-lg p-1.5 text-[#9B8491] hover:bg-[#F1E8EC]"
            >
              <Pencil size={14} />
            </button>

            <button
              type="button"
              onClick={() => deleteTask(task)}
              title="Delete task"
              className="rounded-lg p-1.5 text-[#B98A91] hover:bg-[#F8E8E9]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {hasSubtasks && expanded && (
          <div className="ml-2">
            {task.subtasks.map((subtask) => (
              <TaskRow
                key={subtask.id}
                task={subtask}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      < className="min-h-screen bg-[#FAF7F5] px-5 py-10">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-5 w-32 rounded bg-[#EEE5E5]" />
          <div className="mt-8 h-10 w-2/3 rounded-lg bg-[#EEE5E5]" />
          <div className="mt-4 h-4 w-1/3 rounded bg-[#EEE5E5]" />
          <div className="mt-10 h-48 rounded-3xl bg-[#EEE5E5]" />
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      < className="min-h-screen bg-[#FAF7F5] px-5 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#EEE3E3] bg-white p-8 text-center shadow-sm">
          <FolderKanban
            className="mx-auto text-[#B78AA0]"
            size={32}
          />

          <h1 className="mt-4 text-xl font-semibold text-[#51464B]">
            Could not open this project
          </h1>

          <p className="mt-2 text-sm text-[#95888D]">
            {error ||
              "This project may not exist or may no longer be available."}
          </p>

          <Link
            href="/projects"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B78AA0] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowLeft size={15} />
            Back to projects
          </Link>
        </div>
      </main>
    );
  }

  const projectDue = formatDate(project.dueDate);

  return (
    < className="min-h-screen bg-[#FAF7F5] px-4 py-6 text-[#51464B] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#9A858F] transition hover:text-[#775A69]"
        >
          <ArrowLeft size={16} />
          All projects
        </Link>

        <section className="mt-7 rounded-[28px] border border-[#EFE4E4] bg-white p-6 shadow-[0_8px_30px_rgba(100,70,80,0.04)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>

              <h1 className="mt-4 break-words text-3xl font-semibold tracking-tight text-[#51464B] sm:text-4xl">
                {project.title}
              </h1>

              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-[#95888D]">
                {project.description || "No project description yet."}
              </p>

              <div className="mt-5 flex flex-wrap gap-5 text-xs text-[#9A8D91]">
                {project.startDate && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} />
                    Started {formatDate(project.startDate)}
                  </span>
                )}

                {projectDue && (
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={14} />
                    Due {projectDue}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setProjectEditing(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#EDE1E4] px-4 py-2.5 text-sm font-semibold text-[#98788A] transition hover:bg-[#FAF4F6]"
            >
              <Pencil size={15} />
              Edit project
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#FBF5F6] p-4">
              <p className="text-xs font-medium text-[#A18D95]">
                Overall progress
              </p>

              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-semibold text-[#85677A]">
                  {progress}%
                </span>

                <span className="text-xs text-[#A18D95]">
                  {completedTasks} of {allTasks.length} tasks
                </span>
              </div>

              <div className="mt-3">
                <ProgressBar value={progress} />
              </div>
            </div>

            <div className="rounded-2xl bg-[#F4F5F0] p-4">
              <p className="text-xs font-medium text-[#899181]">
                Milestones
              </p>

              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-semibold text-[#73816D]">
                  {milestones.length}
                </span>

                <span className="text-xs text-[#899181]">
                  {milestoneProgress}% average progress
                </span>
              </div>

              <div className="mt-3">
                <ProgressBar
                  value={milestoneProgress}
                  color="bg-[#91A18A]"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[#F3EFF6] p-4">
              <p className="text-xs font-medium text-[#96889F]">
                Tasks
              </p>

              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-semibold text-[#85738E]">
                  {allTasks.length}
                </span>

                <span className="text-xs text-[#96889F]">
                  {allTasks.length - completedTasks} remaining
                </span>
              </div>

              <div className="mt-3">
                <ProgressBar
                  value={progress}
                  color="bg-[#A797B2]"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[0.95fr_1.35fr]">
          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MilestoneIcon
                    size={19}
                    className="text-[#A98297]"
                  />

                  <h2 className="text-lg font-semibold text-[#574A50]">
                    Milestones
                  </h2>
                </div>

                <p className="mt-1 text-xs text-[#A29499]">
                  Break your project into meaningful stages.
                </p>
              </div>

              <button
                type="button"
                onClick={openNewMilestone}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#B78AA0] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#A77B91]"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {milestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E8DADB] bg-white px-5 py-10 text-center">
                  <MilestoneIcon
                    size={27}
                    className="mx-auto text-[#C4A8B5]"
                  />

                  <p className="mt-3 text-sm font-medium text-[#79666F]">
                    No milestones yet
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#A29499]">
                    Add stages to organize the bigger steps in your project.
                  </p>

                  <button
                    type="button"
                    onClick={openNewMilestone}
                    className="mt-4 text-xs font-semibold text-[#A77B91] hover:underline"
                  >
                    Create your first milestone
                  </button>
                </div>
              ) : (
                milestones.map((milestone) => {
                  const isExpanded =
                    expandedMilestones[milestone.id];

                  return (
                    <div
                      key={milestone.id}
                      className="rounded-2xl border border-[#EFE5E4] bg-white p-4 shadow-[0_3px_12px_rgba(100,70,80,0.025)]"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            toggleMilestoneExpanded(milestone.id)
                          }
                          className="mt-0.5 rounded-lg p-1 text-[#A58D98] hover:bg-[#F8F1F3]"
                        >
                          {isExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-semibold text-[#5D5055]">
                            {milestone.title}
                          </h3>

                          {milestone.description && (
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#9B8D92]">
                              {milestone.description}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-[11px] text-[#A29499]">
                              {milestone.completedTaskCount || 0}/
                              {milestone.taskCount || 0} tasks
                            </span>

                            <span className="text-xs font-semibold text-[#927488]">
                              {milestone.progress || 0}%
                            </span>
                          </div>

                          <div className="mt-2">
                            <ProgressBar
                              value={milestone.progress || 0}
                              color="bg-[#B99AAF]"
                            />
                          </div>

                          {milestone.dueDate && (
                            <p className="mt-2 flex items-center gap-1 text-[11px] text-[#A29499]">
                              <CalendarDays size={12} />
                              Due {formatDate(milestone.dueDate)}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openNewTask({
                                milestoneId: milestone.id,
                              })
                            }
                            title="Add task to milestone"
                            className="rounded-lg p-1.5 text-[#9A8190] hover:bg-[#F5EDF1]"
                          >
                            <Plus size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditMilestone(milestone)
                            }
                            title="Edit milestone"
                            className="rounded-lg p-1.5 text-[#9A8190] hover:bg-[#F5EDF1]"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteMilestone(milestone)
                            }
                            title="Delete milestone"
                            className="rounded-lg p-1.5 text-[#B98A91] hover:bg-[#F8E8E9]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 border-t border-[#F0E8E8] pt-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#A29499]">
                            Tasks in this milestone
                          </p>

                          {(() => {
                            const milestoneTasks = Array.isArray(
                              milestone.tasks
                            )
                              ? milestone.tasks.filter(
                                  (task) => !task.parentId
                                )
                              : tasks.filter(
                                  (task) =>
                                    task.milestoneId === milestone.id
                                );

                            return milestoneTasks.length === 0 ? (
                              <p className="py-2 text-xs text-[#A29499]">
                                No tasks assigned to this milestone yet.
                              </p>
                            ) : (
                              milestoneTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center gap-2 py-2 text-xs text-[#75666D]"
                                >
                                  {task.status === "DONE" ? (
                                    <Check
                                      size={14}
                                      className="text-[#8BA58A]"
                                    />
                                  ) : (
                                    <Circle
                                      size={13}
                                      className="text-[#B99AAF]"
                                    />
                                  )}

                                  <span
                                    className={
                                      task.status === "DONE"
                                        ? "line-through opacity-60"
                                        : ""
                                    }
                                  >
                                    {task.title}
                                  </span>
                                </div>
                              ))
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() =>
                              openNewTask({
                                milestoneId: milestone.id,
                              })
                            }
                            className="mt-2 text-xs font-semibold text-[#A77B91] hover:underline"
                          >
                            + Add a task to this milestone
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ListTodo
                    size={19}
                    className="text-[#A98297]"
                  />

                  <h2 className="text-lg font-semibold text-[#574A50]">
                    Project tasks
                  </h2>
                </div>

                <p className="mt-1 text-xs text-[#A29499]">
                  Keep track of the actions that move this project forward.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openNewTask()}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#B78AA0] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#A77B91]"
              >
                <Plus size={14} />
                Add task
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#EFE5E4] bg-white shadow-[0_3px_15px_rgba(100,70,80,0.025)]">
              {tasks.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <ListTodo
                    size={28}
                    className="mx-auto text-[#C4A8B5]"
                  />

                  <p className="mt-3 text-sm font-medium text-[#79666F]">
                    No tasks for this project yet
                  </p>

                  <p className="mt-1 text-xs text-[#A29499]">
                    Start by adding the first action.
                  </p>

                  <button
                    type="button"
                    onClick={() => openNewTask()}
                    className="mt-4 text-xs font-semibold text-[#A77B91] hover:underline"
                  >
                    Create your first task
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#F3ECEB] p-2">
                  {tasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-[#EDE5EF] bg-[#F7F3F8] p-4">
              <div className="flex items-start gap-3">
                <Target
                  size={18}
                  className="mt-0.5 text-[#9A85A5]"
                />

                <div>
                  <p className="text-xs font-semibold text-[#776781]">
                    Linked goals
                  </p>

                  {project.goalLinks?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.goalLinks.map((link) => {
                        const goal = link.goal || link;

                        return (
                          <Link
                            key={goal.id}
                            href={`/goals/${goal.id}`}
                            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#8B7696] hover:bg-[#EEE6F1]"
                          >
                            {goal.title}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs leading-5 text-[#9A8DA0]">
                      This project isn't linked to a goal yet. You can
                      connect projects and goals from the Goals section.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showMilestoneForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#33252D]/35 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={saveMilestone}
            className="my-auto w-full max-w-lg rounded-3xl border border-[#EFE3E5] bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#594A51]">
                {editingMilestone
                  ? "Edit milestone"
                  : "New milestone"}
              </h2>

              <button
                type="button"
                onClick={() => setShowMilestoneForm(false)}
                className="rounded-full p-2 text-[#A18F95] hover:bg-[#F7F0F1]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <FormField label="Milestone name">
                <input
                  required
                  autoFocus
                  value={milestoneTitle}
                  onChange={(event) =>
                    setMilestoneTitle(event.target.value)
                  }
                  placeholder="e.g. Complete the first version"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  rows={3}
                  value={milestoneDescription}
                  onChange={(event) =>
                    setMilestoneDescription(event.target.value)
                  }
                  placeholder="What should be achieved in this stage?"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Due date">
                <input
                  type="date"
                  value={milestoneDueDate}
                  onChange={(event) =>
                    setMilestoneDueDate(event.target.value)
                  }
                  className={inputClass}
                />
              </FormField>
            </div>

            <ModalActions
              onCancel={() => setShowMilestoneForm(false)}
              saving={saving}
              saveLabel={
                editingMilestone
                  ? "Save changes"
                  : "Create milestone"
              }
            />
          </form>
        </div>
      )}

      {taskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#33252D]/35 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={saveTask}
            className="my-auto w-full max-w-lg rounded-3xl border border-[#EFE3E5] bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#594A51]">
                  {taskModal.mode === "edit"
                    ? "Edit task"
                    : taskModal.parent
                      ? "Add subtask"
                      : "New project task"}
                </h2>

                {taskModal.parent && (
                  <p className="mt-1 text-xs text-[#A29499]">
                    Under: {taskModal.parent.title}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setTaskModal(null)}
                className="rounded-full p-2 text-[#A18F95] hover:bg-[#F7F0F1]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <FormField label="Task name">
                <input
                  required
                  autoFocus
                  value={taskTitle}
                  onChange={(event) =>
                    setTaskTitle(event.target.value)
                  }
                  placeholder="What needs to be done?"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(event) =>
                    setTaskDescription(event.target.value)
                  }
                  placeholder="Add details (optional)"
                  className={inputClass}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Priority">
                  <select
                    value={taskPriority}
                    onChange={(event) =>
                      setTaskPriority(event.target.value)
                    }
                    className={inputClass}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Due date">
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(event) =>
                      setTaskDueDate(event.target.value)
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>

              {!taskModal.parent && (
                <FormField label="Milestone">
                  <select
                    value={taskMilestoneId}
                    onChange={(event) =>
                      setTaskMilestoneId(event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">No milestone</option>

                    {milestones.map((milestone) => (
                      <option
                        key={milestone.id}
                        value={milestone.id}
                      >
                        {milestone.title}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
            </div>

            <ModalActions
              onCancel={() => setTaskModal(null)}
              saving={saving}
              saveLabel={
                taskModal.mode === "edit"
                  ? "Save changes"
                  : taskModal.parent
                    ? "Add subtask"
                    : "Create task"
              }
            />
          </form>
        </div>
      )}

      {projectEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#33252D]/35 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={(event) => {
              event.preventDefault();

              updateProject({
                title: projectTitle.trim(),
                description: projectDescription.trim(),
                status: projectStatus,
                priority: projectPriority,
                dueDate: projectDueDate || null,
              });
            }}
            className="my-auto w-full max-w-lg rounded-3xl border border-[#EFE3E5] bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#594A51]">
                Edit project
              </h2>

              <button
                type="button"
                onClick={() => setProjectEditing(false)}
                className="rounded-full p-2 text-[#A18F95] hover:bg-[#F7F0F1]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <FormField label="Project name">
                <input
                  required
                  value={projectTitle}
                  onChange={(event) =>
                    setProjectTitle(event.target.value)
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  rows={3}
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(event.target.value)
                  }
                  className={inputClass}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Status">
                  <select
                    value={projectStatus}
                    onChange={(event) =>
                      setProjectStatus(event.target.value)
                    }
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Priority">
                  <select
                    value={projectPriority}
                    onChange={(event) =>
                      setProjectPriority(event.target.value)
                    }
                    className={inputClass}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Due date">
                <input
                  type="date"
                  value={projectDueDate}
                  onChange={(event) =>
                    setProjectDueDate(event.target.value)
                  }
                  className={inputClass}
                />
              </FormField>
            </div>

            <ModalActions
              onCancel={() => setProjectEditing(false)}
              saving={saving}
              saveLabel="Save project"
            />
          </form>
        </div>
      )}
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#EDE2E3] bg-[#FDFBFA] px-3.5 py-3 text-sm text-[#594A51] outline-none transition placeholder:text-[#B7A9AE] focus:border-[#C7A0B2] focus:ring-2 focus:ring-[#C7A0B2]/15";

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

function ModalActions({ onCancel, saving, saveLabel }) {
  return (
    <div className="mt-7 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#9A858F] transition hover:bg-[#F8F2F3]"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[#B78AA0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A77B91] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : saveLabel}
      </button>
    </div>
  );
}
