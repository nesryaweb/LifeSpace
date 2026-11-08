"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  BookHeart,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Save,
  Feather,
  Heart,
  Sparkles,
  Lightbulb,
  Cloud,
  LoaderCircle,
  BookOpen,
  RefreshCw,
  PenLine,
} from "lucide-react";

const ENTRY_TYPES = [
  { value: "ALL", label: "All entries" },
  { value: "DAILY", label: "Daily diary" },
  { value: "GRATITUDE", label: "Gratitude" },
  { value: "BRAIN_DUMP", label: "Brain dump" },
  { value: "REFLECTION", label: "Reflection" },
  { value: "IDEA", label: "Ideas" },
];

const TYPE_DETAILS = {
  DAILY: {
    label: "Daily diary",
    icon: BookOpen,
    color: "bg-[#FCE8EF] text-[#A85F7C]",
  },
  GRATITUDE: {
    label: "Gratitude",
    icon: Heart,
    color: "bg-[#F8EDE0] text-[#A77C4F]",
  },
  BRAIN_DUMP: {
    label: "Brain dump",
    icon: Cloud,
    color: "bg-[#EDE8F8] text-[#8069A8]",
  },
  REFLECTION: {
    label: "Reflection",
    icon: Sparkles,
    color: "bg-[#E8F0E8] text-[#66876C]",
  },
  IDEA: {
    label: "Idea",
    icon: Lightbulb,
    color: "bg-[#F8F0D9] text-[#9B8341]",
  },
};

const MOODS = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "grateful", label: "Grateful", emoji: "🥰" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "excited", label: "Excited", emoji: "🤩" },
  { value: "motivated", label: "Motivated", emoji: "💪" },
  { value: "neutral", label: "Okay", emoji: "🙂" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "sad", label: "Sad", emoji: "😔" },
  { value: "anxious", label: "Anxious", emoji: "🥺" },
];

const WRITING_PROMPTS = [
  "What made me smile today, even if it was something small?",
  "What is something I am proud of myself for?",
  "What has been taking up the most space in my mind lately?",
  "What do I want my future self to remember about this moment?",
  "What are three things I am grateful for today?",
  "What is one thing I wish I could say without worrying about being judged?",
  "When did I feel most like myself recently?",
  "What is something I want to let go of?",
  "What would make tomorrow feel like a good day?",
  "What is one thing I have learned about myself this year?",
  "What does the life I want look and feel like?",
  "What is something I keep postponing, and what is one tiny step I could take?",
  "Who or what has brought something good into my life recently?",
  "What do I need more of in my life right now?",
  "What is one difficult thing I have handled better than I realize?",
  "If I could give myself one piece of advice today, what would it be?",
  "What am I looking forward to?",
  "What is something I want to try, learn, or experience?",
  "What does taking care of myself look like today?",
  "What would I do differently if I trusted myself a little more?",
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getMood(moodValue) {
  return MOODS.find((mood) => mood.value === moodValue);
}

function getTypeDetails(type) {
  return TYPE_DETAILS[type] || TYPE_DETAILS.DAILY;
}

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [requestedEntryId, setRequestedEntryId] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);

  const [activePromptIndex, setActivePromptIndex] = useState(0);

  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "DAILY",
    mood: "",
    entryDate: getLocalDateString(),
  });

  const activePrompt = WRITING_PROMPTS[activePromptIndex];

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/journal");

      if (!response.ok) {
        throw new Error("Could not load your journal entries.");
      }

      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRequestedEntryId(params.get("entry"));
  }, []);

  useEffect(() => {
    if (!requestedEntryId || loading) return;

    const entry = entries.find((item) => item.id === requestedEntryId);

    if (entry) {
      setViewingEntry(entry);
    }

    // Remove the query parameter after handling the request.
    window.history.replaceState({}, "", "/journal");
    setRequestedEntryId(null);
  }, [requestedEntryId, loading, entries]);
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesType = activeFilter === "ALL" || entry.type === activeFilter;

      const matchesSearch =
        !query ||
        entry.title?.toLowerCase().includes(query) ||
        entry.content?.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [entries, activeFilter, search]);

  const todayEntries = useMemo(() => {
    const today = getLocalDateString();

    return entries.filter((entry) => {
      return getLocalDateString(new Date(entry.entryDate)) === today;
    });
  }, [entries]);

  function openNewEntry(type = "DAILY") {
    setViewingEntry(null);
    setEditingEntry(null);

    setForm({
      title: "",
      content: "",
      type,
      mood: "",
      entryDate: getLocalDateString(),
    });

    setError("");
    setEditorOpen(true);
  }

  function openPromptEntry() {
    setViewingEntry(null);
    setEditingEntry(null);

    setForm({
      title: activePrompt,
      content: "",
      type: "DAILY",
      mood: "",
      entryDate: getLocalDateString(),
    });

    setError("");
    setEditorOpen(true);
  }

  function showAnotherPrompt() {
    setActivePromptIndex((currentIndex) => {
      const availableIndexes = WRITING_PROMPTS.map((_, index) => index).filter(
        (index) => index !== currentIndex,
      );

      const randomIndex = Math.floor(Math.random() * availableIndexes.length);

      return availableIndexes[randomIndex];
    });
  }

  function openEditEntry(entry) {
    setViewingEntry(null);
    setEditingEntry(entry);

    setForm({
      title: entry.title || "",
      content: entry.content || "",
      type: entry.type || "DAILY",
      mood: entry.mood || "",
      entryDate: getLocalDateString(new Date(entry.entryDate)),
    });

    setError("");
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) return;

    setEditorOpen(false);
    setEditingEntry(null);
    setError("");
  }

  async function handleSave() {
    if (!form.content.trim()) {
      setError("Write something before saving your entry.");
      return;
    }

    if (!form.entryDate) {
      setError("Please choose an entry date.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const isEditing = Boolean(editingEntry);

      const url = isEditing
        ? `/api/journal/${editingEntry.id}`
        : "/api/journal";

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          type: form.type,
          mood: form.mood || null,
          entryDate: new Date(`${form.entryDate}T12:00:00`).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save your entry.");
      }

      setEditorOpen(false);
      setEditingEntry(null);
      setError("");

      await fetchEntries();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this journal entry?",
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`/api/journal/${entry.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this entry.");
      }

      setEntries((current) => current.filter((item) => item.id !== entry.id));

      if (viewingEntry?.id === entry.id) {
        setViewingEntry(null);
      }

      if (editingEntry?.id === entry.id) {
        setEditingEntry(null);
        setEditorOpen(false);
      }
    } catch (err) {
      setError(err.message || "Could not delete this entry.");
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF9F7] px-4 py-7 text-[#51464D] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#B17D96]">
              <BookHeart size={16} />
              <span>YOUR PERSONAL SPACE</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-[#51464D] sm:text-4xl">
              My Journal
            </h1>

            <p className="mt-2 text-sm text-[#968991]">
              A little space for everything on your mind.
            </p>
          </div>

          <button
            onClick={() => openNewEntry()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B77F9A] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#A96F8B]"
          >
            <Plus size={18} />
            Write an entry
          </button>
        </div>

        {/* Welcome card + Writing prompt */}
        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Welcome card */}
          <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[28px] border border-[#F0E3E8] bg-gradient-to-br from-[#F9EAF0] via-[#F8EEF0] to-[#F2EDF7] p-6 sm:p-7">
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2 text-[#A66E88]">
                <Feather size={19} />
                <span className="text-xs font-semibold tracking-[0.16em]">
                  A NOTE TO YOURSELF
                </span>
              </div>

              <h2 className="text-2xl font-semibold leading-snug text-[#66515C]">
                Your thoughts deserve a place to land.
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-[#927D87]">
                Celebrate the little things, work through the difficult ones,
                and keep a record of the person you are becoming.
              </p>
            </div>

            <div className="relative z-10 mt-6">
              <button
                onClick={() => openNewEntry("GRATITUDE")}
                className="inline-flex items-center gap-2 rounded-xl border border-[#DCC2CF] bg-white/70 px-4 py-2.5 text-sm font-medium text-[#94677E] transition hover:bg-white"
              >
                <Heart size={16} />
                Write something you're grateful for
              </button>
            </div>

            <div className="pointer-events-none absolute -right-5 -top-8 hidden rotate-12 text-[#D7B8C8]/50 sm:block">
              <BookHeart size={190} strokeWidth={0.8} />
            </div>

            <Sparkles
              className="pointer-events-none absolute bottom-7 right-10 text-[#C69DB2]"
              size={24}
            />
          </div>

          {/* Writing prompt */}
          <div className="flex min-h-[280px] flex-col justify-between rounded-[28px] border border-[#E9E1F0] bg-gradient-to-br from-[#F5F0FA] to-[#F9F5F8] p-6 sm:p-7">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#9277AE] shadow-sm">
                  <Sparkles size={21} />
                </div>

                <p className="text-xs font-semibold tracking-[0.14em] text-[#9277AE]">
                  A LITTLE INSPIRATION
                </p>
              </div>

              <h2 className="text-xl font-semibold leading-relaxed text-[#665873]">
                {activePrompt}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#A193AA]">
                No perfect answers. Just write whatever comes to mind.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                onClick={showAnotherPrompt}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DED2E9] bg-white/80 px-4 py-2.5 text-xs font-medium text-[#806B99] transition hover:bg-white"
              >
                <RefreshCw size={14} />
                Another prompt
              </button>

              <button
                onClick={openPromptEntry}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9277AE] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#80669C]"
              >
                <PenLine size={14} />
                Use this prompt
              </button>
            </div>
          </div>
        </div>

        {/* Small stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#F0E8E9] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-[#B17D96]">
              <BookOpen size={17} />
              <span className="text-xs font-medium">Total entries</span>
            </div>

            <p className="text-2xl font-semibold text-[#5D5057]">
              {entries.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#F0E8E9] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-[#B17D96]">
              <CalendarDays size={17} />
              <span className="text-xs font-medium">Written today</span>
            </div>

            <p className="text-2xl font-semibold text-[#5D5057]">
              {todayEntries.length}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-[#F0E8E9] bg-white p-4 sm:col-span-1">
            <div className="mb-2 flex items-center gap-2 text-[#B17D96]">
              <Heart size={17} />
              <span className="text-xs font-medium">Your space</span>
            </div>

            <p className="text-sm font-medium text-[#5D5057]">Just for you</p>
          </div>
        </div>

        {/* Entries section */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#5D5057]">Your pages</h2>

            <p className="mt-1 text-sm text-[#A09299]">
              {filteredEntries.length}{" "}
              {filteredEntries.length === 1 ? "entry" : "entries"}
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B2A3AA]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your journal..."
              className="w-full rounded-xl border border-[#EDE4E7] bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#B6AAB0] focus:border-[#C99DB2]"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {ENTRY_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setActiveFilter(type.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
                activeFilter === type.value
                  ? "bg-[#B77F9A] text-white"
                  : "border border-[#EEE4E8] bg-white text-[#8E7D85] hover:border-[#D8B7C7]"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && !editorOpen && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-[#A18D97]">
              <LoaderCircle className="animate-spin" size={20} />
              Loading your journal...
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#E6D8DF] bg-white/70 px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8EDF2] text-[#B77F9A]">
              <BookHeart size={30} />
            </div>

            <h3 className="text-lg font-semibold text-[#66545D]">
              {search || activeFilter !== "ALL"
                ? "No entries found"
                : "Your journal starts here"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#A09299]">
              {search || activeFilter !== "ALL"
                ? "Try another search or choose a different category."
                : "Your first page doesn't have to be perfect. Just start writing."}
            </p>

            {!search && activeFilter === "ALL" && (
              <button
                onClick={() => openNewEntry()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B77F9A] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#A96F8B]"
              >
                <Plus size={17} />
                Write your first entry
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 pb-6 md:grid-cols-2">
            {filteredEntries.map((entry, index) => {
              const typeDetails = getTypeDetails(entry.type);
              const TypeIcon = typeDetails.icon;
              const mood = getMood(entry.mood);

              return (
                <article
                  key={entry.id}
                  className={`group relative overflow-hidden rounded-[22px] border border-[#EFE6E9] bg-white p-5 shadow-[0_3px_14px_rgba(93,65,79,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(93,65,79,0.07)] ${
                    index % 3 === 1 ? "md:rotate-[0.25deg]" : ""
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ${typeDetails.color}`}
                      >
                        <TypeIcon size={13} />
                        {typeDetails.label}
                      </span>

                      {mood && (
                        <span className="rounded-full bg-[#F8F5F3] px-2.5 py-1.5 text-xs text-[#897B80]">
                          {mood.emoji} {mood.label}
                        </span>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        onClick={() => openEditEntry(entry)}
                        title="Edit entry"
                        className="rounded-lg p-2 text-[#A18B96] transition hover:bg-[#F8EDF2] hover:text-[#A96F8B]"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => handleDelete(entry)}
                        title="Delete entry"
                        className="rounded-lg p-2 text-[#B5A1AA] transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingEntry(entry)}
                    className="block w-full text-left"
                  >
                    <h3 className="mb-2 text-lg font-semibold text-[#5D5057]">
                      {entry.title || "Untitled entry"}
                    </h3>

                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#8F8188]">
                      {entry.content.length > 230
                        ? `${entry.content.slice(0, 230)}...`
                        : entry.content}
                    </p>
                  </button>

                  <div className="mt-5 flex items-center justify-between border-t border-[#F2EAED] pt-4">
                    <div className="flex items-center gap-2 text-xs text-[#AA9AA1]">
                      <CalendarDays size={14} />
                      {formatDate(entry.entryDate)}
                    </div>

                    <span className="text-xs font-medium text-[#C095AA]">
                      Read entry
                    </span>
                  </div>

                  <div className="pointer-events-none absolute -bottom-5 -right-4 rotate-12 text-[#EADCE3]/40">
                    <Feather size={55} strokeWidth={1} />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-[#EEE5E8] py-6 text-center">
          <p className="flex items-center justify-center gap-2 text-xs text-[#B09FA7]">
            <Heart size={13} />
            Your journal is your own little corner of the world.
          </p>
        </div>
      </div>

      {/* Entry reading view */}
      {viewingEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#45363F]/40 p-3 backdrop-blur-[3px] sm:p-6"
          onClick={() => setViewingEntry(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-[#F0E4E9] bg-[#FFFCFB] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const typeDetails = getTypeDetails(viewingEntry.type);
              const TypeIcon = typeDetails.icon;
              const mood = getMood(viewingEntry.mood);

              return (
                <>
                  <div className="flex items-center justify-between border-b border-[#F0E7EA] px-5 py-4 sm:px-7">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EAF0] text-[#B17D96]">
                        <BookOpen size={20} />
                      </div>

                      <div>
                        <h2 className="font-semibold text-[#5D5057]">
                          Your journal page
                        </h2>
                        <p className="text-xs text-[#A8979F]">
                          A moment captured in your words.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setViewingEntry(null)}
                      className="rounded-xl p-2 text-[#A7959D] transition hover:bg-[#F7EEF1]"
                      title="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="overflow-y-auto px-6 py-7 sm:px-9 sm:py-9">
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${typeDetails.color}`}
                      >
                        <TypeIcon size={14} />
                        {typeDetails.label}
                      </span>

                      {mood && (
                        <span className="rounded-full bg-[#F8F5F3] px-3 py-1.5 text-xs text-[#897B80]">
                          {mood.emoji} {mood.label}
                        </span>
                      )}
                    </div>

                    <div className="mb-7">
                      <p className="mb-3 flex items-center gap-2 text-xs text-[#AA9AA1]">
                        <CalendarDays size={14} />
                        {formatDate(viewingEntry.entryDate)}
                      </p>

                      <h1 className="text-2xl font-semibold leading-snug text-[#5D5057] sm:text-3xl">
                        {viewingEntry.title || "Untitled entry"}
                      </h1>
                    </div>

                    <div className="border-t border-[#F0E7EA] pt-7">
                      <p className="whitespace-pre-wrap break-words text-sm leading-8 text-[#75666E] sm:text-base sm:leading-9">
                        {viewingEntry.content}
                      </p>
                    </div>

                    <div className="mt-10 flex items-center gap-2 border-t border-[#F0E7EA] pt-5 text-xs text-[#B09FA7]">
                      <Heart size={14} />
                      Every page is part of your story.
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-[#F0E7EA] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <button
                      onClick={() => handleDelete(viewingEntry)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-[#B28A98] transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>

                    <button
                      onClick={() => openEditEntry(viewingEntry)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B77F9A] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#A96F8B]"
                    >
                      <Pencil size={16} />
                      Edit entry
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Entry editor */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#45363F]/35 p-3 backdrop-blur-[3px] sm:p-6">
          <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-[#F0E4E9] bg-[#FFFCFB] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F0E7EA] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EAF0] text-[#B17D96]">
                  <Feather size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-[#5D5057]">
                    {editingEntry ? "Edit your entry" : "A new page"}
                  </h2>
                  <p className="text-xs text-[#A8979F]">
                    Take your time. This space is yours.
                  </p>
                </div>
              </div>

              <button
                onClick={closeEditor}
                className="rounded-xl p-2 text-[#A7959D] transition hover:bg-[#F7EEF1]"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-7">
              {error && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="mb-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#8C7882]">
                    ENTRY TYPE
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#EDE2E7] bg-white px-3 py-3 text-sm text-[#65545D] outline-none focus:border-[#C99DB2]"
                  >
                    {ENTRY_TYPES.filter((item) => item.value !== "ALL").map(
                      (type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#8C7882]">
                    ENTRY DATE
                  </label>

                  <input
                    type="date"
                    value={form.entryDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        entryDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#EDE2E7] bg-white px-3 py-3 text-sm text-[#65545D] outline-none focus:border-[#C99DB2]"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-[#8C7882]">
                  TITLE <span className="font-normal">(optional)</span>
                </label>

                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Give this page a title..."
                  className="w-full rounded-xl border border-[#EDE2E7] bg-white px-4 py-3 text-base font-medium text-[#5D5057] outline-none placeholder:font-normal placeholder:text-[#C1B3BA] focus:border-[#C99DB2]"
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold text-[#8C7882]">
                  WHAT'S ON YOUR MIND?
                </label>

                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  placeholder="Start wherever you are. Write about your day, your thoughts, your dreams, or absolutely anything..."
                  rows={11}
                  className="w-full resize-y rounded-xl border border-[#EDE2E7] bg-[#FFFEFD] px-4 py-4 text-sm leading-7 text-[#65545D] outline-none placeholder:text-[#C1B3BA] focus:border-[#C99DB2]"
                />

                <p className="mt-1 text-right text-xs text-[#B5A5AC]">
                  {form.content.length} characters
                </p>
              </div>

              <div>
                <label className="mb-3 block text-xs font-semibold text-[#8C7882]">
                  HOW ARE YOU FEELING?
                </label>

                <div className="flex flex-wrap gap-2">
                  {MOODS.map((mood) => {
                    const selected = form.mood === mood.value;

                    return (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            mood: selected ? "" : mood.value,
                          }))
                        }
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
                          selected
                            ? "border-[#C99DB2] bg-[#F8EAF0] text-[#986B82]"
                            : "border-[#EEE5E9] bg-white text-[#907F87] hover:border-[#D8BDCA]"
                        }`}
                      >
                        <span>{mood.emoji}</span>
                        {mood.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#F0E7EA] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <button
                onClick={closeEditor}
                disabled={saving}
                className="rounded-xl px-4 py-3 text-sm font-medium text-[#9B8992] transition hover:bg-[#F8F2F4] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !form.content.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B77F9A] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#A96F8B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {saving
                  ? "Saving..."
                  : editingEntry
                    ? "Save changes"
                    : "Save entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
