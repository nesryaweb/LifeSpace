
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  GraduationCap,
  Clock3,
  CheckCircle2,
  Target,
  CalendarDays,
  BookMarked,
  Video,
  Globe,
  FileText,
  Book,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  Library,
  NotebookPen,
  AlertCircle,
  Brain,
  BookText,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
];

const INITIAL_FORM = {
  title: "",
  description: "",
  goalId: "",
  status: "ACTIVE",
  startDate: "",
  targetDate: "",
};

const STATUS_STYLES = {
  ACTIVE: {
    label: "Active",
    className: "bg-[#E7F1E8] text-[#688A70]",
    dot: "bg-[#86A98D]",
  },
  PAUSED: {
    label: "Paused",
    className: "bg-[#F2EDF7] text-[#9277AE]",
    dot: "bg-[#A58BBF]",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-[#F9EAF0] text-[#A66F86]",
    dot: "bg-[#D493AC]",
  },
};

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getGoalList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.goals)) return data.goals;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getPathList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.paths)) return data.paths;
  if (Array.isArray(data?.learningPaths)) return data.learningPaths;
  return [];
}

function getResourceIcon(type) {
  switch (type) {
    case "BOOK":
      return Book;
    case "VIDEO":
      return Video;
    case "WEBSITE":
      return Globe;
    case "COURSE":
      return GraduationCap;
    case "ARTICLE":
      return FileText;
    default:
      return Library;
  }
}

export default function LearningPage() {
  const [paths, setPaths] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [menuPathId, setMenuPathId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [pathsResponse, goalsResponse] = await Promise.all([
        fetch("/api/learning", { cache: "no-store" }),
        fetch("/api/goals", { cache: "no-store" }),
      ]);

      const pathsData = await pathsResponse.json();
      const goalsData = await goalsResponse.json();

      if (!pathsResponse.ok) {
        throw new Error(
          pathsData.error || "Could not load your learning paths."
        );
      }

      setPaths(getPathList(pathsData));

      if (goalsResponse.ok) {
        setGoals(
          getGoalList(goalsData).filter(
            (goal) => goal.status !== "COMPLETED"
          )
        );
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = paths.length;
    const active = paths.filter((path) => path.status === "ACTIVE").length;
    const completed = paths.filter(
      (path) => path.status === "COMPLETED"
    ).length;

    const totalLessons = paths.reduce(
      (sum, path) => sum + (path.totalLessons || 0),
      0
    );

    const completedLessons = paths.reduce(
      (sum, path) => sum + (path.completedLessons || 0),
      0
    );

    return {
      total,
      active,
      completed,
      totalLessons,
      completedLessons,
    };
  }, [paths]);

  const filteredPaths = useMemo(() => {
    const query = search.trim().toLowerCase();

    return paths.filter((path) => {
      const matchesSearch =
        !query ||
        path.title?.toLowerCase().includes(query) ||
        path.description?.toLowerCase().includes(query) ||
        path.goal?.title?.toLowerCase().includes(query);

      const matchesStatus =
        activeFilter === "ALL" || path.status === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [paths, search, activeFilter]);

  function openNewPath() {
    setEditingPath(null);
    setForm(INITIAL_FORM);
    setFormError("");
    setEditorOpen(true);
    setMenuPathId(null);
  }

  function openEditPath(path) {
    setEditingPath(path);
    setForm({
      title: path.title || "",
      description: path.description || "",
      goalId: path.goalId || "",
      status: path.status || "ACTIVE",
      startDate: path.startDate
        ? path.startDate.slice(0, 10)
        : "",
      targetDate: path.targetDate
        ? path.targetDate.slice(0, 10)
        : "",
    });
    setFormError("");
    setEditorOpen(true);
    setMenuPathId(null);
  }

  function closeEditor() {
    if (saving) return;

    setEditorOpen(false);
    setEditingPath(null);
    setForm(INITIAL_FORM);
    setFormError("");
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Please give your learning path a title.");
      return;
    }

    if (
      form.startDate &&
      form.targetDate &&
      form.targetDate < form.startDate
    ) {
      setFormError("The target date cannot be before the start date.");
      return;
    }

    setSaving(true);

    try {
      const url = editingPath
        ? `/api/learning/${editingPath.id}`
        : "/api/learning";

      const response = await fetch(url, {
        method: editingPath ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          goalId: form.goalId || null,
          status: form.status,
          startDate: form.startDate || null,
          targetDate: form.targetDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save your learning path.");
      }

      setEditorOpen(false);
      setEditingPath(null);
      setForm(INITIAL_FORM);

      await loadData();
    } catch (err) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(path) {
    const confirmed = window.confirm(
      `Delete "${path.title}" and all its lessons, resources, and notes? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(path.id);
    setMenuPathId(null);

    try {
      const response = await fetch(`/api/learning/${path.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this learning path.");
      }

      setPaths((current) =>
        current.filter((item) => item.id !== path.id)
      );
    } catch (err) {
      window.alert(err.message || "Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-[#51434A] sm:px-7 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1400px]">

        {/* Page heading */}
        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#A27BAE]">
              <GraduationCap size={19} />
              <span className="text-xs font-semibold tracking-[0.16em]">
                PERSONAL GROWTH
              </span>
            </div>

            <h1 className="text-3xl font-semibold text-[#594B5D] sm:text-4xl">
              My Learning
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#968A98]">
              A little progress every day adds up to something wonderful.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/learning/glossary"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6DDEC] bg-white px-4 py-3 text-xs font-semibold text-[#9277AE] transition hover:bg-[#F8F4FA]"
            >
              <BookText size={16} />
              My glossary
            </Link>

            <Link
              href="/learning/review"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E6DDEC] bg-[#F5F0F8] px-4 py-3 text-xs font-semibold text-[#9277AE] transition hover:bg-[#EEE6F4]"
            >
              <Brain size={16} />
              Review & Recall
            </Link>

            <button
              onClick={openNewPath}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#9277AE] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#80669C]"
            >
              <Plus size={18} />
              New learning path
            </button>
          </div>
        </div>

        {/* Welcome banner */}
        <div className="relative mb-7 overflow-hidden rounded-[28px] border border-[#E9E1F0] bg-gradient-to-r from-[#F4EEF9] via-[#F8F0F5] to-[#F8EBF0] p-6 sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-[#9277AE]">
              <Sparkles size={17} />
              <span className="text-xs font-semibold tracking-[0.14em]">
                YOUR SPACE TO GROW
              </span>
            </div>

            <h2 className="text-xl font-semibold leading-relaxed text-[#665873] sm:text-2xl">
              Keep learning. Keep becoming.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#96899E]">
              Organize the things you want to learn, collect helpful resources,
              keep your notes, and celebrate every lesson you complete.
            </p>
          </div>

          <div className="pointer-events-none absolute -right-5 -top-8 hidden rotate-[-12deg] text-[#CBB8D9]/50 sm:block">
            <BookOpen size={190} strokeWidth={0.8} />
          </div>

          <Sparkles
            size={20}
            className="pointer-events-none absolute bottom-7 right-10 text-[#B79BCB]"
          />
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-[22px] border border-[#F0E5EA] bg-white p-4 sm:p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F9EAF0] text-[#B77D96]">
              <BookMarked size={19} />
            </div>
            <p className="text-2xl font-semibold text-[#66515C]">
              {stats.total}
            </p>
            <p className="mt-1 text-xs text-[#A18E98]">Learning paths</p>
          </div>

          <div className="rounded-[22px] border border-[#E6EEE6] bg-white p-4 sm:p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF2EA] text-[#78987D]">
              <Clock3 size={19} />
            </div>
            <p className="text-2xl font-semibold text-[#5D7160]">
              {stats.active}
            </p>
            <p className="mt-1 text-xs text-[#91A092]">Currently active</p>
          </div>

          <div className="rounded-[22px] border border-[#E9E1F0] bg-white p-4 sm:p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F2EDF7] text-[#9277AE]">
              <CheckCircle2 size={19} />
            </div>
            <p className="text-2xl font-semibold text-[#716083]">
              {stats.completed}
            </p>
            <p className="mt-1 text-xs text-[#A093AE]">Completed paths</p>
          </div>

          <div className="rounded-[22px] border border-[#EEE8E1] bg-white p-4 sm:p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F0E8] text-[#A88B63]">
              <GraduationCap size={19} />
            </div>
            <p className="text-2xl font-semibold text-[#78674F]">
              {stats.completedLessons}
              <span className="ml-1 text-sm font-medium text-[#B2A28B]">
                / {stats.totalLessons}
              </span>
            </p>
            <p className="mt-1 text-xs text-[#A99B87]">Lessons completed</p>
          </div>
        </div>

        {/* Learning paths section */}
        <section>
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold text-[#625464]">
                Your learning paths
              </h2>
              <p className="mt-1 text-sm text-[#A095A2]">
                All your subjects and skills in one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A2B1]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search learning paths..."
                  className="w-full rounded-xl border border-[#EDE5EA] bg-white py-2.5 pl-10 pr-4 text-sm text-[#655866] outline-none transition placeholder:text-[#B6AAB5] focus:border-[#C8B3D5] sm:w-60"
                />
              </div>

              <div className="relative">
                <select
                  value={activeFilter}
                  onChange={(event) => setActiveFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#EDE5EA] bg-white py-2.5 pl-4 pr-10 text-sm text-[#766A79] outline-none focus:border-[#C8B3D5] sm:w-40"
                >
                  <option value="ALL">All paths</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A99BAB]"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle size={17} />
              {error}
              <button
                onClick={loadData}
                className="ml-auto font-medium underline"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-[26px] border border-[#F0E7EC] bg-white">
              <div className="flex flex-col items-center gap-3 text-[#A18BAE]">
                <LoaderCircle size={28} className="animate-spin" />
                <p className="text-sm">Loading your learning space...</p>
              </div>
            </div>
          ) : filteredPaths.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[26px] border border-dashed border-[#E8DDE7] bg-white px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F4EEF8] text-[#9A80B2]">
                {paths.length === 0 ? (
                  <GraduationCap size={29} />
                ) : (
                  <Search size={25} />
                )}
              </div>

              <h3 className="text-lg font-semibold text-[#695A6C]">
                {paths.length === 0
                  ? "Your learning journey starts here"
                  : "No learning paths found"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#A397A5]">
                {paths.length === 0
                  ? "Create your first learning path and give the skills you want to develop a home."
                  : "Try another search or change the status filter."}
              </p>

              {paths.length === 0 && (
                <button
                  onClick={openNewPath}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#9277AE] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#80669C]"
                >
                  <Plus size={17} />
                  Create your first path
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPaths.map((path, index) => {
                const status =
                  STATUS_STYLES[path.status] || STATUS_STYLES.ACTIVE;

                const progress = Math.min(
                  100,
                  Math.max(0, path.progress || 0)
                );

                const completedLessons = path.completedLessons || 0;
                const totalLessons = path.totalLessons || 0;
                const resourceCount = path._count?.resources || 0;
                const noteCount = path._count?.notes || 0;

                const accents = [
                  {
                    bg: "bg-[#F9EDF1]",
                    icon: "text-[#B77D96]",
                    bar: "bg-[#D493AC]",
                  },
                  {
                    bg: "bg-[#F1ECF7]",
                    icon: "text-[#9277AE]",
                    bar: "bg-[#AC91C5]",
                  },
                  {
                    bg: "bg-[#EDF3EC]",
                    icon: "text-[#78977D]",
                    bar: "bg-[#91B295]",
                  },
                ];

                const accent = accents[index % accents.length];

                return (
                  <article
                    key={path.id}
                    className="group relative flex flex-col rounded-[25px] border border-[#EFE6EB] bg-white p-5 shadow-[0_3px_16px_rgba(103,76,94,0.035)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(103,76,94,0.08)]"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent.bg} ${accent.icon}`}
                      >
                        <BookOpen size={22} />
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuPathId(
                              menuPathId === path.id ? null : path.id
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#A99BA8] transition hover:bg-[#F8F3F6] hover:text-[#756477]"
                          aria-label="Learning path options"
                        >
                          <MoreHorizontal size={20} />
                        </button>

                        {menuPathId === path.id && (
                          <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-xl border border-[#EFE6EB] bg-white p-1.5 shadow-lg">
                            <button
                              onClick={() => openEditPath(path)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#746678] hover:bg-[#F8F3F6]"
                            >
                              <Pencil size={15} />
                              Edit path
                            </button>

                            <button
                              onClick={() => handleDelete(path)}
                              disabled={deletingId === path.id}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#B46F7D] hover:bg-[#FCF0F2]"
                            >
                              {deletingId === path.id ? (
                                <LoaderCircle size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                              Delete path
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold leading-snug text-[#655666]">
                      {path.title}
                    </h3>

                    <p className="mt-2 min-h-[42px] text-sm leading-5 text-[#A095A2]">
                      {path.description || "A new space for your learning journey."}
                    </p>

                    {path.goal && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#FAF6F8] px-3 py-2.5">
                        <Target
                          size={15}
                          className="shrink-0 text-[#B47F98]"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-[#B09DA8]">
                            Connected goal
                          </p>
                          <p className="truncate text-xs font-medium text-[#806B79]">
                            {path.goal.title}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-[#8E7F90]">
                          Learning progress
                        </span>
                        <span className="text-xs font-semibold text-[#786783]">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#F1EDF1]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${accent.bar}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-[#A89BA9]">
                        {completedLessons} of {totalLessons} lessons completed
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-4 border-t border-[#F2EBEF] pt-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#9D909F]">
                        <Library size={14} />
                        {resourceCount} resources
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#9D909F]">
                        <NotebookPen size={14} />
                        {noteCount} notes
                      </div>
                    </div>

                    {(path.startDate || path.targetDate) && (
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-[#A394A4]">
                        <CalendarDays size={14} />
                        {path.startDate && formatDate(path.startDate)}
                        {path.startDate && path.targetDate && " — "}
                        {path.targetDate && `Target ${formatDate(path.targetDate)}`}
                      </div>
                    )}

                    <Link
                      href={`/learning/${path.id}`}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8DDEB] bg-[#FBF8FC] px-4 py-3 text-sm font-medium text-[#8D75A0] transition hover:border-[#CDBBDA] hover:bg-[#F4EEF8]"
                    >
                      Open learning path
                      <ArrowUpRight size={16} />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Create / Edit modal */}
        {editorOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#302637]/35 p-4 backdrop-blur-[3px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeEditor();
            }}
          >
            <div className="my-auto w-full max-w-xl overflow-hidden rounded-[28px] border border-[#EFE3EA] bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-[#F2EAF0] bg-gradient-to-r from-[#F9EDF2] to-[#F4EFF8] px-6 py-5">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[#A47791]">
                    <GraduationCap size={18} />
                    <span className="text-[10px] font-semibold tracking-[0.15em]">
                      YOUR LEARNING JOURNEY
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-[#665565]">
                    {editingPath ? "Edit learning path" : "Create a learning path"}
                  </h2>

                  <p className="mt-1 text-xs text-[#A08F9D]">
                    Give the subject or skill you're learning a home.
                  </p>
                </div>

                <button
                  onClick={closeEditor}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#A18E9C] transition hover:bg-white/70"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#786879]">
                    Learning path name *
                  </label>
                  <input
                    autoFocus
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    placeholder="e.g. French, English, Web Development..."
                    className="w-full rounded-xl border border-[#EDE3EA] bg-[#FFFCFD] px-4 py-3 text-sm text-[#655666] outline-none placeholder:text-[#B6A8B3] focus:border-[#C9B3D6]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#786879]">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="What do you want to learn or achieve?"
                    className="w-full resize-none rounded-xl border border-[#EDE3EA] bg-[#FFFCFD] px-4 py-3 text-sm leading-6 text-[#655666] outline-none placeholder:text-[#B6A8B3] focus:border-[#C9B3D6]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#786879]">
                    Connect to a goal
                    <span className="ml-1 font-normal text-[#B1A3AF]">
                      (optional)
                    </span>
                  </label>

                  <div className="relative">
                    <select
                      value={form.goalId}
                      onChange={(event) =>
                        updateForm("goalId", event.target.value)
                      }
                      className="w-full appearance-none rounded-xl border border-[#EDE3EA] bg-[#FFFCFD] px-4 py-3 pr-10 text-sm text-[#655666] outline-none focus:border-[#C9B3D6]"
                    >
                      <option value="">No connected goal</option>
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#A99BAB]"
                    />
                  </div>

                  <p className="mt-1.5 text-[11px] text-[#A99BA8]">
                    For example, connect French to your goal of becoming fluent.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#786879]">
                      Start date
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        updateForm("startDate", event.target.value)
                      }
                      className="w-full rounded-xl border border-[#EDE3EA] bg-[#FFFCFD] px-3 py-3 text-sm text-[#655666] outline-none focus:border-[#C9B3D6]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#786879]">
                      Target date
                    </label>
                    <input
                      type="date"
                      value={form.targetDate}
                      min={form.startDate || undefined}
                      onChange={(event) =>
                        updateForm("targetDate", event.target.value)
                      }
                      className="w-full rounded-xl border border-[#EDE3EA] bg-[#FFFCFD] px-3 py-3 text-sm text-[#655666] outline-none focus:border-[#C9B3D6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#786879]">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateForm("status", event.target.value)
                      }
                      className="w-full appearance-none rounded-xl border border-[#EDE3EA] bg-[#FFFCFD] px-4 py-3 pr-10 text-sm text-[#655666] outline-none focus:border-[#C9B3D6]"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#A99BAB]"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                    <AlertCircle size={15} />
                    {formError}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-[#F2EAF0] pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditor}
                    disabled={saving}
                    className="rounded-xl border border-[#E9DFE7] px-5 py-3 text-sm font-medium text-[#8F7F8E] transition hover:bg-[#FAF6F8]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9277AE] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#80669C] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        {editingPath ? "Save changes" : "Create learning path"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
