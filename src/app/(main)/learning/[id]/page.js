
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  BookMarked,
  GraduationCap,
  Target,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Library,
  NotebookPen,
  Video,
  Globe,
  FileText,
  Book,
  ExternalLink,
  LoaderCircle,
  AlertCircle,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  StickyNote,
  Star,
  Tag,
  Lightbulb,
  HelpCircle,
  Search,
  Filter,
  Heart,
} from "lucide-react";

const STATUS_STYLES = {
  ACTIVE: "bg-[#E7F1E8] text-[#688A70]",
  PAUSED: "bg-[#F2EDF7] text-[#9277AE]",
  COMPLETED: "bg-[#F9EAF0] text-[#A66F86]",
};

const LESSON_STYLES = {
  NOT_STARTED: {
    label: "Not started",
    icon: CircleDashed,
    color: "text-[#A99BA8]",
    background: "bg-[#F5F1F4]",
  },
  IN_PROGRESS: {
    label: "In progress",
    icon: Clock3,
    color: "text-[#9277AE]",
    background: "bg-[#F2EDF7]",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-[#78977D]",
    background: "bg-[#EDF3EC]",
  },
};

const RESOURCE_TYPES = [
  { value: "BOOK", label: "Book" },
  { value: "VIDEO", label: "Video" },
  { value: "WEBSITE", label: "Website" },
  { value: "COURSE", label: "Course" },
  { value: "ARTICLE", label: "Article" },
  { value: "OTHER", label: "Other" },
];

const NOTE_TYPES = [
  { value: "CONCEPT", label: "Concept" },
  { value: "TUTORIAL", label: "Tutorial" },
  { value: "VOCABULARY", label: "Vocabulary" },
  { value: "RESEARCH", label: "Research" },
  { value: "SUMMARY", label: "Summary" },
  { value: "PROBLEM_SOLUTION", label: "Problem & solution" },
  { value: "OTHER", label: "Other" },
];

const NOTE_STATUSES = [
  { value: "NOT_UNDERSTOOD", label: "Not understood" },
  { value: "LEARNING", label: "Learning" },
  { value: "UNDERSTOOD", label: "Understood" },
];

const NOTE_DIFFICULTIES = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const EMPTY_LESSON = {
  title: "",
  description: "",
  status: "NOT_STARTED",
};

const EMPTY_RESOURCE = {
  title: "",
  type: "BOOK",
  author: "",
  url: "",
  description: "",
};

const EMPTY_NOTE = {
  title: "",
  content: "",
  examples: "",
  keyTakeaways: "",
  questions: "",
  type: "CONCEPT",
  status: "LEARNING",
  difficulty: "BEGINNER",
  lessonId: "",
  keywords: [],
  isFavorite: false,
  reviewDate: "",
};

function createEmptyKeyword() {
  return {
    id: crypto.randomUUID(),
    name: "",
    meaning: "",
    example: "",
  };
}

function formatDate(date) {
  if (!date) return "Not set";

  return new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDateInputValue(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
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

function EmptySection({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E9E0E8] bg-[#FFFCFD] px-5 py-9 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4EEF8] text-[#9A80B2]">
        <Icon size={22} />
      </div>
      <h3 className="text-sm font-semibold text-[#766779]">{title}</h3>
      <p className="mt-1 max-w-xs text-xs leading-5 text-[#A397A5]">
        {description}
      </p>
      {children}
    </div>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#766779]">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 text-[11px] leading-5 text-[#A397A5]">
          {hint}
        </p>
      )}
    </div>
  );
}

function NoteStatusBadge({ status }) {
  const styles = {
    NOT_UNDERSTOOD: "bg-[#FBECEF] text-[#B77D96]",
    LEARNING: "bg-[#F2EDF7] text-[#9277AE]",
    UNDERSTOOD: "bg-[#EDF3EC] text-[#78977D]",
  };

  const label =
    NOTE_STATUSES.find((item) => item.value === status)?.label ||
    "Learning";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
        styles[status] || styles.LEARNING
      }`}
    >
      {label}
    </span>
  );
}

export default function LearningPathPage() {
  const params = useParams();
  const pathId = params.id;

  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // Lesson state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonError, setLessonError] = useState("");
  const [deletingLessonId, setDeletingLessonId] = useState(null);

  // Resource state
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState(EMPTY_RESOURCE);
  const [savingResource, setSavingResource] = useState(false);
  const [resourceError, setResourceError] = useState("");
  const [deletingResourceId, setDeletingResourceId] = useState(null);

  // Learning note state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE);
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [noteSearch, setNoteSearch] = useState("");
  const [noteFilter, setNoteFilter] = useState("ALL");

  // Load learning path and its complete notes
  const loadPath = useCallback(async () => {
    if (!pathId) return;

    setLoading(true);
    setError("");

    try {
      const [pathResponse, notesResponse] = await Promise.all([
        fetch(`/api/learning/${pathId}`, {
          cache: "no-store",
        }),
        fetch(`/api/learning/${pathId}/notes`, {
          cache: "no-store",
        }),
      ]);

      const pathData = await pathResponse.json();
      const notesData = await notesResponse.json();

      if (!pathResponse.ok) {
        throw new Error(
          pathData.error || "Could not load this learning path."
        );
      }

      if (!notesResponse.ok) {
        throw new Error(
          notesData.error || "Could not load learning notes."
        );
      }

      setPath({
        ...pathData,
        notes: Array.isArray(notesData)
          ? notesData
          : notesData.notes || [],
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [pathId]);

  useEffect(() => {
    loadPath();
  }, [loadPath]);

  // ---------------- LESSONS ----------------

  function openAddLesson() {
    setEditingLesson(null);
    setLessonForm(EMPTY_LESSON);
    setLessonError("");
    setLessonModalOpen(true);
  }

  function openEditLesson(lesson) {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title || "",
      description: lesson.description || "",
      status: lesson.status || "NOT_STARTED",
    });
    setLessonError("");
    setLessonModalOpen(true);
  }

  async function handleSaveLesson(event) {
    event.preventDefault();

    if (!lessonForm.title.trim()) {
      setLessonError("Please enter a lesson title.");
      return;
    }

    setSavingLesson(true);
    setLessonError("");

    try {
      const isEditing = Boolean(editingLesson);

      const url = isEditing
        ? `/api/learning/${pathId}/lessons/${editingLesson.id}`
        : `/api/learning/${pathId}/lessons`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim(),
          status: lessonForm.status,
          ...(!isEditing && {
            position: path?.lessons?.length || 0,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save this lesson.");
      }

      setLessonModalOpen(false);
      setEditingLesson(null);
      setLessonForm(EMPTY_LESSON);
      await loadPath();
    } catch (err) {
      setLessonError(err.message || "Something went wrong.");
    } finally {
      setSavingLesson(false);
    }
  }

  async function handleStatusChange(lesson, newStatus) {
    if (lesson.status === newStatus) return;

    setActionError("");

    try {
      const response = await fetch(
        `/api/learning/${pathId}/lessons/${lesson.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update lesson status.");
      }

      await loadPath();
    } catch (err) {
      setActionError(err.message || "Could not update lesson status.");
    }
  }

  async function handleDeleteLesson(lesson) {
    if (!window.confirm(`Delete "${lesson.title}"?`)) return;

    setDeletingLessonId(lesson.id);
    setActionError("");

    try {
      const response = await fetch(
        `/api/learning/${pathId}/lessons/${lesson.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this lesson.");
      }

      await loadPath();
    } catch (err) {
      setActionError(err.message || "Could not delete this lesson.");
    } finally {
      setDeletingLessonId(null);
    }
  }

  // ---------------- RESOURCES ----------------

  function openAddResource() {
    setEditingResource(null);
    setResourceForm(EMPTY_RESOURCE);
    setResourceError("");
    setResourceModalOpen(true);
  }

  function openEditResource(resource) {
    setEditingResource(resource);
    setResourceForm({
      title: resource.title || "",
      type: resource.type || "OTHER",
      author: resource.author || "",
      url: resource.url || "",
      description: resource.description || "",
    });
    setResourceError("");
    setResourceModalOpen(true);
  }

  function closeResourceModal() {
    if (savingResource) return;

    setResourceModalOpen(false);
    setEditingResource(null);
    setResourceForm(EMPTY_RESOURCE);
    setResourceError("");
  }

  async function handleSaveResource(event) {
    event.preventDefault();

    if (!resourceForm.title.trim()) {
      setResourceError("Please enter a resource title.");
      return;
    }

    const url = resourceForm.url.trim();

    if (url) {
      try {
        const parsedUrl = new URL(url);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error();
        }
      } catch {
        setResourceError(
          "Please enter a valid URL beginning with https:// or http://."
        );
        return;
      }
    }

    setSavingResource(true);
    setResourceError("");

    try {
      const isEditing = Boolean(editingResource);

      const endpoint = isEditing
        ? `/api/learning/${pathId}/resources/${editingResource.id}`
        : `/api/learning/${pathId}/resources`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resourceForm.title.trim(),
          type: resourceForm.type,
          author: resourceForm.author.trim(),
          url,
          description: resourceForm.description.trim(),
          ...(!isEditing && {
            position: path?.resources?.length || 0,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save this resource.");
      }

      setResourceModalOpen(false);
      setEditingResource(null);
      setResourceForm(EMPTY_RESOURCE);
      await loadPath();
    } catch (err) {
      setResourceError(err.message || "Something went wrong.");
    } finally {
      setSavingResource(false);
    }
  }

  async function handleDeleteResource(resource) {
    if (!window.confirm(`Delete "${resource.title}" from your resources?`)) {
      return;
    }

    setDeletingResourceId(resource.id);
    setActionError("");

    try {
      const response = await fetch(
        `/api/learning/${pathId}/resources/${resource.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this resource.");
      }

      await loadPath();
    } catch (err) {
      setActionError(err.message || "Could not delete this resource.");
    } finally {
      setDeletingResourceId(null);
    }
  }

  // ---------------- LEARNING NOTES ----------------

  function openAddNote(lessonId = "") {
    setEditingNote(null);

    setNoteForm({
      ...EMPTY_NOTE,
      keywords: [],
      lessonId,
    });

    setNoteError("");
    setNoteModalOpen(true);
  }

  function openEditNote(note) {
    setEditingNote(note);

    setNoteForm({
      title: note.title || "",
      content: note.content || "",
      examples: note.examples || "",
      keyTakeaways: note.keyTakeaways || "",
      questions: note.questions || "",
      type: note.type || "CONCEPT",
      status: note.status || "LEARNING",
      difficulty: note.difficulty || "BEGINNER",
      lessonId: note.lessonId || "",
      keywords: (note.keywords || []).map((keyword) => ({
        id: keyword.id || crypto.randomUUID(),
        name: keyword.name || "",
        meaning: keyword.meaning || "",
        example: keyword.example || "",
      })),
      isFavorite: Boolean(note.isFavorite),
      reviewDate: getDateInputValue(note.reviewDate),
    });

    setNoteError("");
    setNoteModalOpen(true);
  }

  function closeNoteModal() {
    if (savingNote) return;

    setNoteModalOpen(false);
    setEditingNote(null);
    setNoteForm(EMPTY_NOTE);
    setNoteError("");
  }

  function updateNoteField(field, value) {
    setNoteForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addKeyword() {
    setNoteForm((current) => ({
      ...current,
      keywords: [
        ...current.keywords,
        createEmptyKeyword(),
      ],
    }));
  }

  function updateKeyword(index, field, value) {
    setNoteForm((current) => ({
      ...current,
      keywords: current.keywords.map((keyword, i) =>
        i === index
          ? { ...keyword, [field]: value }
          : keyword
      ),
    }));
  }

  function removeKeyword(index) {
    setNoteForm((current) => ({
      ...current,
      keywords: current.keywords.filter((_, i) => i !== index),
    }));
  }

  async function handleSaveNote(event) {
    event.preventDefault();

    if (!noteForm.content.trim()) {
      setNoteError("Please write the explanation for your note.");
      return;
    }

    // Ignore completely empty keyword cards, but require a meaning
    // whenever a keyword name has been entered.
    const keywords = noteForm.keywords
      .map((keyword) => ({
        name: keyword.name.trim(),
        meaning: keyword.meaning.trim(),
        example: keyword.example.trim(),
      }))
      .filter(
        (keyword) =>
          keyword.name || keyword.meaning || keyword.example
      );

    const incompleteKeyword = keywords.find(
      (keyword) => !keyword.name || !keyword.meaning
    );

    if (incompleteKeyword) {
      setNoteError(
        "Every keyword needs both a name and a meaning. You can remove an empty keyword card."
      );
      return;
    }

    setSavingNote(true);
    setNoteError("");

    const payload = {
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
      examples: noteForm.examples.trim(),
      keyTakeaways: noteForm.keyTakeaways.trim(),
      questions: noteForm.questions.trim(),
      type: noteForm.type,
      status: noteForm.status,
      difficulty: noteForm.difficulty,
      lessonId: noteForm.lessonId || null,
      keywords,
      isFavorite: noteForm.isFavorite,
      reviewDate: noteForm.reviewDate || null,
    };

    try {
      const isEditing = Boolean(editingNote);

      const endpoint = isEditing
        ? `/api/learning/${pathId}/notes/${editingNote.id}`
        : `/api/learning/${pathId}/notes`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save this note.");
      }

      setNoteModalOpen(false);
      setEditingNote(null);
      setNoteForm(EMPTY_NOTE);

      await loadPath();
    } catch (err) {
      setNoteError(err.message || "Something went wrong.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(note) {
    const noteTitle = note.title?.trim() || "this note";

    if (!window.confirm(`Delete "${noteTitle}"? This cannot be undone.`)) {
      return;
    }

    setDeletingNoteId(note.id);
    setActionError("");

    try {
      const response = await fetch(
        `/api/learning/${pathId}/notes/${note.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this note.");
      }

      await loadPath();
    } catch (err) {
      setActionError(err.message || "Could not delete this note.");
    } finally {
      setDeletingNoteId(null);
    }
  }

  async function handleToggleFavorite(note) {
    setActionError("");

    try {
      const response = await fetch(
        `/api/learning/${pathId}/notes/${note.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isFavorite: !note.isFavorite,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update favorite.");
      }

      await loadPath();
    } catch (err) {
      setActionError(err.message || "Could not update favorite.");
    }
  }

  // ---------------- PAGE STATES ----------------

  if (loading) {
    return (
      < className="min-h-screen px-4 py-8 text-[#51434A] sm:px-7 lg:px-10">
        <div className="mx-auto flex min-h-[60vh] max-w-[1400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#A18BAE]">
            <LoaderCircle size={30} className="animate-spin" />
            <p className="text-sm">Opening your learning space...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !path) {
    return (
      < className="min-h-screen px-4 py-8 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Link
            href="/learning"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#9277AE] hover:text-[#80669C]"
          >
            <ArrowLeft size={17} />
            Back to Learning
          </Link>

          <div className="rounded-[26px] border border-red-100 bg-red-50 p-6 text-sm text-red-600">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              {error || "Learning path not found."}
            </div>
            <button onClick={loadPath} className="mt-3 font-medium underline">
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const lessons = path.lessons || [];
  const resources = path.resources || [];
  const notes = path.notes || [];

  const completedLessons = lessons.filter(
    (lesson) => lesson.status === "COMPLETED"
  ).length;

  const totalLessons = lessons.length;

  const progress =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  const favoriteNotes = notes.filter((note) => note.isFavorite).length;

  const filteredNotes = notes.filter((note) => {
    const search = noteSearch.trim().toLowerCase();

    const matchesSearch =
      !search ||
      [
        note.title,
        note.content,
        note.examples,
        note.keyTakeaways,
        note.questions,
        ...(note.keywords || []).flatMap((keyword) => [
          keyword.name,
          keyword.meaning,
          keyword.example,
        ]),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));

    const matchesFilter =
      noteFilter === "ALL" ||
      (noteFilter === "FAVORITES" && note.isFavorite) ||
      (noteFilter === "REVIEW" && Boolean(note.reviewDate)) ||
      (noteFilter === "UNDERSTOOD" && note.status === "UNDERSTOOD") ||
      (noteFilter === "LEARNING" && note.status === "LEARNING") ||
      (noteFilter === "NOT_UNDERSTOOD" &&
        note.status === "NOT_UNDERSTOOD");

    return matchesSearch && matchesFilter;
  });

  return (
    < className="min-h-screen px-4 py-6 text-[#51434A] sm:px-7 lg:px-10 lg:py-9">
      <div className="mx-auto w-full max-w-[1400px]">
        <Link
          href="/learning"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#9277AE] transition hover:text-[#80669C]"
        >
          <ArrowLeft size={17} />
          All learning paths
        </Link>

        {/* Path heading */}
        <section className="relative mb-7 overflow-hidden rounded-[28px] border border-[#E9E1F0] bg-gradient-to-br from-[#F4EEF9] via-[#F8F0F5] to-[#F8EBF0] p-6 sm:p-8">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  STATUS_STYLES[path.status] || STATUS_STYLES.ACTIVE
                }`}
              >
                {path.status?.replaceAll("_", " ") || "Active"}
              </span>

              <span className="flex items-center gap-1.5 text-xs text-[#A18FA6]">
                <GraduationCap size={15} />
                Learning path
              </span>
            </div>

            <h1 className="text-3xl font-semibold leading-tight text-[#594B5D] sm:text-4xl">
              {path.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#96899E]">
              {path.description ||
                "Your personal space to learn, practice, and grow."}
            </p>

            {path.goal && (
              <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-white/70 bg-white/65 px-3.5 py-2.5">
                <Target size={16} className="shrink-0 text-[#B47F98]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B09DA8]">
                    Connected goal
                  </p>
                  <p className="truncate text-sm font-medium text-[#806B79]">
                    {path.goal.title}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute -right-5 -top-8 hidden rotate-[-12deg] text-[#CBB8D9]/40 sm:block">
            <BookOpen size={210} strokeWidth={0.7} />
          </div>
          <Sparkles
            size={22}
            className="pointer-events-none absolute bottom-8 right-12 text-[#B79BCB]"
          />
        </section>

        {/* Progress and dates */}
        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] border border-[#E9E1F0] bg-white p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#96899E]">
                  Overall progress
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#716083]">
                  {progress}%
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2EDF7] text-[#9277AE]">
                <GraduationCap size={21} />
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-[#F1EDF1]">
              <div
                className="h-full rounded-full bg-[#AC91C5] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-[#A397A5]">
              {completedLessons} of {totalLessons} lessons completed
            </p>
          </div>

          <div className="rounded-[24px] border border-[#F0E5EA] bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F9EAF0] text-[#B77D96]">
              <CalendarDays size={19} />
            </div>

            <p className="text-xs text-[#A18E98]">Learning timeline</p>
            <p className="mt-2 text-sm font-semibold text-[#66515C]">
              {formatDate(path.startDate)}
            </p>
            <p className="mt-1 text-xs text-[#A18E98]">Start date</p>

            <div className="my-3 border-t border-[#F2EBEF]" />

            <p className="text-sm font-semibold text-[#66515C]">
              {formatDate(path.targetDate)}
            </p>
            <p className="mt-1 text-xs text-[#A18E98]">Target date</p>
          </div>
        </section>

        {/* Shared action error */}
        {actionError && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
            <AlertCircle size={15} />
            {actionError}
          </div>
        )}

        {/* Lessons */}
        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BookMarked size={19} className="text-[#B77D96]" />
                <h2 className="text-xl font-semibold text-[#625464]">
                  Lessons
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#A095A2]">
                Your topics, milestones, and learning steps.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#F9EDF1] px-3 py-1 text-xs font-medium text-[#A66F86]">
                {lessons.length} lessons
              </span>
              <button
                onClick={openAddLesson}
                className="inline-flex items-center gap-2 rounded-xl bg-[#9277AE] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#80669C]"
              >
                <Plus size={15} />
                Add lesson
              </button>
            </div>
          </div>

          {lessons.length === 0 ? (
            <EmptySection
              icon={BookOpen}
              title="No lessons added yet"
              description="Start organizing this learning path by adding your first lesson."
            >
              <button
                onClick={openAddLesson}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#9277AE] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#80669C]"
              >
                <Plus size={15} />
                Add your first lesson
              </button>
            </EmptySection>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-[#EFE6EB] bg-white">
              {lessons.map((lesson, index) => {
                const status =
                  LESSON_STYLES[lesson.status] || LESSON_STYLES.NOT_STARTED;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={lesson.id}
                    className={`flex flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:gap-4 sm:px-5 ${
                      index !== lessons.length - 1
                        ? "border-b border-[#F2EBEF]"
                        : ""
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F7F2F7] text-xs font-semibold text-[#9277AE]">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[#695A6C]">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#A397A5]">
                          {lesson.description}
                        </p>
                      )}
                      {lesson.dueDate && (
                        <p className="mt-1 text-[11px] text-[#A99BA8]">
                          Due {formatDate(lesson.dueDate)}
                        </p>
                      )}
                    </div>

                    <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon size={14} className={status.color} />
                        <select
                          value={lesson.status}
                          onChange={(event) =>
                            handleStatusChange(lesson, event.target.value)
                          }
                          className={`max-w-[125px] cursor-pointer rounded-full border-0 px-2.5 py-1.5 text-[10px] font-medium outline-none ${status.background} ${status.color}`}
                        >
                          <option value="NOT_STARTED">Not started</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAddNote(lesson.id)}
                          title="Add a note to this lesson"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#78977D] transition hover:bg-[#EDF3EC]"
                        >
                          <NotebookPen size={14} />
                        </button>
                        <button
                          onClick={() => openEditLesson(lesson)}
                          title="Edit lesson"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9277AE] transition hover:bg-[#F4EEF8]"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson)}
                          disabled={deletingLessonId === lesson.id}
                          title="Delete lesson"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B77D96] transition hover:bg-[#FBEFF3] disabled:opacity-50"
                        >
                          {deletingLessonId === lesson.id ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Resources */}
        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Library size={19} className="text-[#9277AE]" />
                <h2 className="text-xl font-semibold text-[#625464]">
                  Resources
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#A095A2]">
                Books, courses, videos, websites, and useful materials.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#F2EDF7] px-3 py-1 text-xs font-medium text-[#9277AE]">
                {resources.length} resources
              </span>
              <button
                onClick={openAddResource}
                className="inline-flex items-center gap-2 rounded-xl bg-[#9277AE] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#80669C]"
              >
                <Plus size={15} />
                Add resource
              </button>
            </div>
          </div>

          {resources.length === 0 ? (
            <EmptySection
              icon={Library}
              title="Your resource library is empty"
              description="Keep useful learning materials together in this space."
            >
              <button
                onClick={openAddResource}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#9277AE] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#80669C]"
              >
                <Plus size={15} />
                Add your first resource
              </button>
            </EmptySection>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {resources.map((resource) => {
                const ResourceIcon = getResourceIcon(resource.type);

                return (
                  <article
                    key={resource.id}
                    className="rounded-[22px] border border-[#EFE6EB] bg-white p-4 transition hover:border-[#DED1E7]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EEF8] text-[#9277AE]">
                        <ResourceIcon size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-[#695A6C]">
                          {resource.title}
                        </h3>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#A397A5]">
                          {resource.type?.replaceAll("_", " ") || "Resource"}
                        </p>
                        {resource.author && (
                          <p className="mt-1 text-xs text-[#A095A2]">
                            {resource.author}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => openEditResource(resource)}
                          title="Edit resource"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9277AE] transition hover:bg-[#F4EEF8]"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource)}
                          disabled={deletingResourceId === resource.id}
                          title="Delete resource"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B77D96] transition hover:bg-[#FBEFF3] disabled:opacity-50"
                        >
                          {deletingResourceId === resource.id ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    {resource.description && (
                      <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-[#A095A2]">
                        {resource.description}
                      </p>
                    )}

                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#9277AE] hover:text-[#80669C]"
                      >
                        Open resource
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Learning Notes */}
        <section className="mb-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <NotebookPen size={19} className="text-[#78977D]" />
                <h2 className="text-xl font-semibold text-[#625464]">
                  Learning notes
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#A095A2]">
                Build your personal knowledge library with explanations,
                examples, and useful keywords.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#EDF3EC] px-3 py-1 text-xs font-medium text-[#78977D]">
                {notes.length} notes
              </span>
              <span className="rounded-full bg-[#FAF3E7] px-3 py-1 text-xs font-medium text-[#B18A55]">
                {favoriteNotes} favorites
              </span>
              <button
                onClick={() => openAddNote()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#78977D] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#66866C]"
              >
                <Plus size={15} />
                Add note
              </button><Link
  href="/learning/glossary"
  className="inline-flex items-center gap-2 rounded-xl border border-[#E6DDEC] bg-white px-4 py-2.5 text-xs font-semibold text-[#9277AE] transition hover:bg-[#F7F2FA]"
>
  <Library size={15} />
  My glossary
</Link>
            </div>
          </div>

          {notes.length > 0 && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A397A5]"
                />
                <input
                  type="search"
                  value={noteSearch}
                  onChange={(event) => setNoteSearch(event.target.value)}
                  placeholder="Search notes, explanations, examples, keywords..."
                  className="w-full rounded-xl border border-[#E9E0E8] bg-white py-3 pl-10 pr-4 text-sm text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#A7BDA8]"
                />
              </div>

              <div className="relative sm:w-52">
                <Filter
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A397A5]"
                />
                <select
                  value={noteFilter}
                  onChange={(event) => setNoteFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#E9E0E8] bg-white py-3 pl-9 pr-4 text-sm text-[#766779] outline-none focus:border-[#A7BDA8]"
                >
                  <option value="ALL">All notes</option>
                  <option value="FAVORITES">Favorites</option>
                  <option value="REVIEW">Has review date</option>
                  <option value="NOT_UNDERSTOOD">Not understood</option>
                  <option value="LEARNING">Learning</option>
                  <option value="UNDERSTOOD">Understood</option>
                </select>
              </div>
            </div>
          )}

          {notes.length === 0 ? (
            <EmptySection
              icon={NotebookPen}
              title="No notes written yet"
              description="Save your explanations, examples, discoveries, and important takeaways here."
            >
              <button
                onClick={() => openAddNote()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#78977D] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#66866C]"
              >
                <Plus size={15} />
                Write your first note
              </button>
            </EmptySection>
          ) : filteredNotes.length === 0 ? (
            <EmptySection
              icon={Search}
              title="No matching notes"
              description="Try another search term or change your note filter."
            >
              <button
                onClick={() => {
                  setNoteSearch("");
                  setNoteFilter("ALL");
                }}
                className="mt-4 text-xs font-semibold text-[#78977D] underline"
              >
                Clear filters
              </button>
            </EmptySection>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredNotes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-[22px] border border-[#E6EEE6] bg-white p-5 transition hover:shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#F2EAF7] px-2.5 py-1 text-[10px] font-semibold text-[#9274B0]">
                          {NOTE_TYPES.find((item) => item.value === note.type)
                            ?.label || "Note"}
                        </span>
                        <NoteStatusBadge status={note.status} />
                      </div>

                      <h3 className="text-base font-semibold text-[#627365]">
                        {note.title || "Untitled note"}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {note.lesson ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F2EDF7] px-2.5 py-1 text-[10px] font-medium text-[#9277AE]">
                            <BookOpen size={11} />
                            {note.lesson.title}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EDF3EC] px-2.5 py-1 text-[10px] font-medium text-[#78977D]">
                            <StickyNote size={11} />
                            General note
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFavorite(note)}
                      title={
                        note.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#B18A55] transition hover:bg-[#FAF4E9]"
                    >
                      <Star
                        size={17}
                        fill={note.isFavorite ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#8C998D]">
                    {note.content}
                  </p>

                  {note.examples && (
                    <div className="mt-4 rounded-xl bg-[#FBF3F6] p-3.5">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Lightbulb size={14} className="text-[#B96F91]" />
                        <p className="text-xs font-semibold text-[#B96F91]">
                          Examples
                        </p>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-5 text-[#8C7C85]">
                        {note.examples}
                      </p>
                    </div>
                  )}

                  {note.keywords?.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-3 flex items-center gap-1.5">
                        <Tag size={13} className="text-[#9277AE]" />
                        <span className="text-[10px] font-semibold text-[#9277AE]">
                          Keywords & meanings
                        </span>
                      </div>

                      <div className="space-y-2">
                        {note.keywords.map((keyword) => (
                          <div
                            key={keyword.id}
                            className="rounded-xl border border-[#EAE2F0] bg-[#FCFAFD] p-3"
                          >
                            <p className="text-xs font-semibold text-[#80669C]">
                              {keyword.name}
                            </p>

                            <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#817487]">
                              {keyword.meaning || "No meaning added yet."}
                            </p>

                            {keyword.example && (
                              <div className="mt-2 border-t border-[#EEE8F2] pt-2">
                                <p className="text-[10px] font-semibold text-[#A18FA6]">
                                  Example
                                </p>
                                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#9B909F]">
                                  {keyword.example}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {note.keyTakeaways && (
                    <div className="mt-4 rounded-xl bg-[#F0F5EF] p-3.5">
                      <p className="mb-1.5 text-xs font-semibold text-[#78977D]">
                        Key takeaways
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-5 text-[#7F9181]">
                        {note.keyTakeaways}
                      </p>
                    </div>
                  )}

                  {note.questions && (
                    <div className="mt-4 rounded-xl bg-[#FAF5E9] p-3.5">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <HelpCircle size={13} className="text-[#B18A55]" />
                        <p className="text-xs font-semibold text-[#B18A55]">
                          Questions to revisit
                        </p>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-5 text-[#97866D]">
                        {note.questions}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EDF1EC] pt-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#A0A99F]">
                      <span>{note.difficulty || "BEGINNER"}</span>
                      <span>·</span>
                      <span>Updated {formatDate(note.updatedAt)}</span>
                    </div>

                    {note.reviewDate && (
                      <span className="flex items-center gap-1 rounded-full bg-[#F2EDF7] px-2.5 py-1 text-[10px] font-medium text-[#9277AE]">
                        <CalendarDays size={11} />
                        Review {formatDate(note.reviewDate)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex justify-end gap-1">
                    <button
                      onClick={() => openEditNote(note)}
                      title="Edit note"
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#78977D] transition hover:bg-[#EDF3EC]"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteNote(note)}
                      disabled={deletingNoteId === note.id}
                      title="Delete note"
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#B77D96] transition hover:bg-[#FBEFF3] disabled:opacity-50"
                    >
                      {deletingNoteId === note.id ? (
                        <LoaderCircle size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ---------------- LESSON MODAL ---------------- */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3F3345]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[26px] border border-[#EFE5EC] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F2EBEF] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-[#625464]">
                  {editingLesson ? "Edit lesson" : "Add a lesson"}
                </h2>
                <p className="mt-1 text-xs text-[#A397A5]">
                  Organize the next step in your learning journey.
                </p>
              </div>
              <button
                onClick={() => setLessonModalOpen(false)}
                disabled={savingLesson}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#A397A5] hover:bg-[#F7F2F7]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-5 p-5 sm:p-6">
              <FormField label="Lesson title *">
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(event) =>
                    setLessonForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Introduction to French grammar"
                  className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={lessonForm.description}
                  onChange={(event) =>
                    setLessonForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="What will you learn in this lesson?"
                  className="w-full resize-y rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm leading-6 text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
                />
              </FormField>

              <FormField label="Status">
                <select
                  value={lessonForm.status}
                  onChange={(event) =>
                    setLessonForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none focus:border-[#B69ACF]"
                >
                  <option value="NOT_STARTED">Not started</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </FormField>

              {lessonError && (
                <p className="text-xs text-red-600">{lessonError}</p>
              )}

              <div className="flex justify-end gap-2 border-t border-[#F2EBEF] pt-4">
                <button
                  type="button"
                  onClick={() => setLessonModalOpen(false)}
                  disabled={savingLesson}
                  className="rounded-xl border border-[#E9E0E8] px-4 py-2.5 text-xs font-medium text-[#887A8B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLesson}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#9277AE] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#80669C] disabled:opacity-60"
                >
                  {savingLesson ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {savingLesson ? "Saving..." : "Save lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- RESOURCE MODAL ---------------- */}
      {resourceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#3F3345]/35 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeResourceModal();
            }
          }}
        >
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-[26px] border border-[#EFE5EC] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F2EBEF] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-[#625464]">
                  {editingResource ? "Edit resource" : "Add a resource"}
                </h2>
                <p className="mt-1 text-xs text-[#A397A5]">
                  Keep your learning materials organized in one place.
                </p>
              </div>
              <button
                onClick={closeResourceModal}
                disabled={savingResource}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#A397A5] transition hover:bg-[#F7F2F7]"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveResource}
              className="max-h-[75vh] space-y-4 overflow-y-auto p-5 sm:p-6"
            >
              <FormField label="Resource title *">
                <input
                  type="text"
                  value={resourceForm.title}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. English Grammar in Use"
                  autoFocus
                  className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
                />
              </FormField>

              <FormField label="Resource type">
                <select
                  value={resourceForm.type}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none focus:border-[#B69ACF]"
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Author / creator">
                <input
                  type="text"
                  value={resourceForm.author}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      author: event.target.value,
                    }))
                  }
                  placeholder="Author, instructor, or creator"
                  className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
                />
              </FormField>

              <FormField
                label="URL"
                hint="Optional. You can save books or offline materials without a URL."
              >
                <input
                  type="url"
                  value={resourceForm.url}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      url: event.target.value,
                    }))
                  }
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={resourceForm.description}
                  onChange={(event) =>
                    setResourceForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Why is this resource useful? What will you use it for?"
                  className="w-full resize-y rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm leading-6 text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
                />
              </FormField>

              {resourceError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                  <AlertCircle size={15} />
                  {resourceError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-[#F2EBEF] pt-4">
                <button
                  type="button"
                  onClick={closeResourceModal}
                  disabled={savingResource}
                  className="rounded-xl border border-[#E9E0E8] px-4 py-2.5 text-xs font-medium text-[#887A8B] transition hover:bg-[#FAF7FA] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResource}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#9277AE] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#80669C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingResource ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {savingResource ? "Saving..." : "Save resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- LEARNING NOTE MODAL ---------------- */}
      {noteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#3F3345]/40 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeNoteModal();
            }
          }}
        >
          <div className="my-auto w-full max-w-3xl overflow-hidden rounded-[26px] border border-[#E6EEE6] bg-white shadow-2xl">
            {/* Modal heading */}
            <div className="flex items-center justify-between border-b border-[#EDF1EC] px-5 py-4 sm:px-7">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF3EC] text-[#78977D]">
                    <NotebookPen size={18} />
                  </div>
                  <h2 className="text-lg font-semibold text-[#625464]">
                    {editingNote ? "Edit learning note" : "Create a learning note"}
                  </h2>
                </div>
                <p className="mt-2 text-xs text-[#A397A5]">
                  Capture what you learn and make it easier to remember.
                </p>
              </div>

              <button
                onClick={closeNoteModal}
                disabled={savingNote}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#A397A5] transition hover:bg-[#F7F2F7] disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveNote}
              className="max-h-[78vh] space-y-5 overflow-y-auto p-5 sm:p-7"
            >
              {/* Title and type */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Note title">
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={(event) =>
                      updateNoteField("title", event.target.value)
                    }
                    placeholder="e.g. Understanding variables"
                    autoFocus
                    className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#A7BDA8]"
                  />
                </FormField>

                <FormField label="Note type">
                  <select
                    value={noteForm.type}
                    onChange={(event) =>
                      updateNoteField("type", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none focus:border-[#A7BDA8]"
                  >
                    {NOTE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Lesson association */}
              <FormField
                label="Attach to lesson"
                hint="Choose a lesson to connect this note to a specific topic, or keep it as a general learning note."
              >
                <select
                  value={noteForm.lessonId}
                  onChange={(event) =>
                    updateNoteField("lessonId", event.target.value)
                  }
                  className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none focus:border-[#A7BDA8]"
                >
                  <option value="">General learning note</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Explanation */}
              <FormField
                label="Explanation *"
                hint="Write the concept in your own words. You can use paragraphs or bullet points."
              >
                <textarea
                  value={noteForm.content}
                  onChange={(event) =>
                    updateNoteField("content", event.target.value)
                  }
                  rows={6}
                  placeholder="What did you learn? Explain the idea in your own words..."
                  className="w-full resize-y rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm leading-6 text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#A7BDA8]"
                />
              </FormField>

              {/* Examples */}
              <FormField
                label="Examples"
                hint="Add practical examples, sample sentences, code, or real-life applications."
              >
                <textarea
                  value={noteForm.examples}
                  onChange={(event) =>
                    updateNoteField("examples", event.target.value)
                  }
                  rows={4}
                  placeholder={"Example 1:\nExample 2:\n\nHow is this used in practice?"}
                  className="w-full resize-y rounded-xl border border-[#F0E3E9] bg-[#FFFBFC] px-4 py-3 text-sm leading-6 text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#D9A9BC]"
                />
              </FormField>

              {/* Keywords and meanings */}
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-[#766779]">
                      Keywords & meanings
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-[#A397A5]">
                      Build your personal glossary. Each keyword needs a meaning.
                      You can add as many as you like.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addKeyword}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#F2EAF7] px-3.5 py-2.5 text-xs font-semibold text-[#9274B0] transition hover:bg-[#E9DDF2]"
                  >
                    <Plus size={14} />
                    Add another keyword
                  </button>
                </div>

                {noteForm.keywords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#E5DCEB] bg-[#FCFAFD] px-4 py-6 text-center">
                    <Tag
                      size={20}
                      className="mx-auto mb-2 text-[#B69ACF]"
                    />
                    <p className="text-xs font-medium text-[#9277AE]">
                      No keywords added yet
                    </p>
                    <p className="mt-1 text-[11px] text-[#A397A5]">
                      Add important terms and write down what they mean.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {noteForm.keywords.map((keyword, index) => (
                      <div
                        key={keyword.id}
                        className="rounded-2xl border border-[#E9E0E8] bg-[#FFFCFD] p-4 sm:p-5"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <span className="rounded-full bg-[#F2EAF7] px-3 py-1 text-[10px] font-semibold text-[#9274B0]">
                            Keyword {index + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeKeyword(index)}
                            title="Remove keyword"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B77D96] transition hover:bg-[#FBEFF3]"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <FormField label="Keyword *">
                            <input
                              type="text"
                              value={keyword.name}
                              onChange={(event) =>
                                updateKeyword(
                                  index,
                                  "name",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. Variable"
                              className="w-full rounded-xl border border-[#E9E0E8] bg-white px-4 py-3 text-sm text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
                            />
                          </FormField>

                          <FormField
                            label="Meaning *"
                            hint="Explain what this word or concept means in your own words."
                          >
                            <textarea
                              value={keyword.meaning}
                              onChange={(event) =>
                                updateKeyword(
                                  index,
                                  "meaning",
                                  event.target.value
                                )
                              }
                              rows={3}
                              placeholder="A variable is a named place where a program stores a value..."
                              className="w-full resize-y rounded-xl border border-[#E9E0E8] bg-white px-4 py-3 text-sm leading-6 text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
                            />
                          </FormField>

                          <FormField
                            label="Example"
                            hint="Optional. Add a sentence, practical example, or code snippet."
                          >
                            <textarea
                              value={keyword.example}
                              onChange={(event) =>
                                updateKeyword(
                                  index,
                                  "example",
                                  event.target.value
                                )
                              }
                              rows={2}
                              placeholder="Example: let age = 28;"
                              className="w-full resize-y rounded-xl border border-[#E9E0E8] bg-white px-4 py-3 text-sm leading-6 text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
                            />
                          </FormField>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] leading-5 text-[#A397A5]">
                  Keywords are saved in your personal glossary and can be reused
                  across your learning notes. Updating a shared keyword's
                  meaning also updates it wherever that keyword is used.
                </p>
              </div>

              {/* Key takeaways */}
              <FormField
                label="Key takeaways"
                hint="What are the most important things you want to remember?"
              >
                <textarea
                  value={noteForm.keyTakeaways}
                  onChange={(event) =>
                    updateNoteField("keyTakeaways", event.target.value)
                  }
                  rows={3}
                  placeholder={"• The most important idea...\n• Remember that...\n• I should practice..."}
                  className="w-full resize-y rounded-xl border border-[#E6EEE6] bg-[#FBFDFB] px-4 py-3 text-sm leading-6 text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#A7BDA8]"
                />
              </FormField>

              {/* Questions */}
              <FormField
                label="Questions to revisit"
                hint="Keep track of anything confusing or something you want to investigate later."
              >
                <textarea
                  value={noteForm.questions}
                  onChange={(event) =>
                    updateNoteField("questions", event.target.value)
                  }
                  rows={3}
                  placeholder={"What is still unclear?\nWhat do I need to research further?"}
                  className="w-full resize-y rounded-xl border border-[#F0E8D9] bg-[#FFFEFA] px-4 py-3 text-sm leading-6 text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#D7BD8F]"
                />
              </FormField>

              {/* Learning status and difficulty */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Understanding status">
                  <select
                    value={noteForm.status}
                    onChange={(event) =>
                      updateNoteField("status", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none focus:border-[#A7BDA8]"
                  >
                    {NOTE_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Difficulty">
                  <select
                    value={noteForm.difficulty}
                    onChange={(event) =>
                      updateNoteField("difficulty", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none focus:border-[#A7BDA8]"
                  >
                    {NOTE_DIFFICULTIES.map((difficulty) => (
                      <option
                        key={difficulty.value}
                        value={difficulty.value}
                      >
                        {difficulty.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Review date and favorite */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Review date"
                  hint="Optional. Set a date to revisit this note."
                >
                  <input
                    type="date"
                    value={noteForm.reviewDate}
                    onChange={(event) =>
                      updateNoteField("reviewDate", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none focus:border-[#A7BDA8]"
                  />
                </FormField>

                <div className="flex items-end">
                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[#F0E5D5] bg-[#FFFCF7] px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={noteForm.isFavorite}
                      onChange={(event) =>
                        updateNoteField("isFavorite", event.target.checked)
                      }
                      className="h-4 w-4 accent-[#B18A55]"
                    />
                    <span className="flex items-center gap-2 text-sm font-medium text-[#927B59]">
                      <Heart
                        size={16}
                        fill={noteForm.isFavorite ? "currentColor" : "none"}
                      />
                      Add to favorites
                    </span>
                  </label>
                </div>
              </div>

              {noteError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                  <AlertCircle size={15} />
                  {noteError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-[#EDF1EC] pt-4">
                <button
                  type="button"
                  onClick={closeNoteModal}
                  disabled={savingNote}
                  className="rounded-xl border border-[#E9E0E8] px-4 py-2.5 text-xs font-medium text-[#887A8B] transition hover:bg-[#FAF7FA] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingNote}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#78977D] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#66866C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingNote ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {savingNote ? "Saving..." : "Save note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
