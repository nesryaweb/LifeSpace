
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BookMarked,
  Search,
  Tag,
  Pencil,
  Trash2,
  X,
  Save,
  LoaderCircle,
  AlertCircle,
  Lightbulb,
  Library,
  FileText,
  Sparkles,
} from "lucide-react";

function formatDate(date) {
  if (!date) return "Not set";

  return new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-[#E5DCEB] bg-white px-5 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2EAF7] text-[#9277AE]">
        <Icon size={25} />
      </div>

      <h3 className="text-sm font-semibold text-[#766779]">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-[#A397A5]">
        {description}
      </p>

      {children}
    </div>
  );
}

export default function LearningGlossaryPage() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editingKeyword, setEditingKeyword] = useState(null);
  const [form, setForm] = useState({
    name: "",
    meaning: "",
    example: "",
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadKeywords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/learning/keywords", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load your glossary.");
      }

      setKeywords(data.keywords || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  function openEdit(keyword) {
    setEditingKeyword(keyword);

    setForm({
      name: keyword.name || "",
      meaning: keyword.meaning || "",
      example: keyword.example || "",
    });

    setFormError("");
  }

  function closeEdit() {
    if (saving) return;

    setEditingKeyword(null);
    setForm({
      name: "",
      meaning: "",
      example: "",
    });
    setFormError("");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError("Please enter a keyword name.");
      return;
    }

    if (!form.meaning.trim()) {
      setFormError("Please enter the meaning.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(
        `/api/learning/keywords/${editingKeyword.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            meaning: form.meaning.trim(),
            example: form.example.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update this keyword.");
      }

      setEditingKeyword(null);
      await loadKeywords();
    } catch (err) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(keyword) {
    const message =
      keyword.noteCount > 0
        ? `Delete "${keyword.name}" from your glossary? It will also be removed from the ${keyword.noteCount} note(s) using it.`
        : `Delete "${keyword.name}" from your glossary?`;

    if (!window.confirm(message)) return;

    setDeletingId(keyword.id);
    setError("");

    try {
      const response = await fetch(
        `/api/learning/keywords/${keyword.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this keyword.");
      }

      setKeywords((current) =>
        current.filter((item) => item.id !== keyword.id)
      );
    } catch (err) {
      setError(err.message || "Could not delete this keyword.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredKeywords = keywords.filter((keyword) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      keyword.name,
      keyword.meaning,
      keyword.example,
      ...(keyword.notes || []).map((note) => note.title),
      ...(keyword.notes || []).map((note) => note.learningPathTitle),
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  const totalUses = keywords.reduce(
    (total, keyword) => total + (keyword.noteCount || 0),
    0
  );

  return (
    < className="min-h-screen px-4 py-6 text-[#51434A] sm:px-7 lg:px-10 lg:py-9">
      <div className="mx-auto w-full max-w-[1400px]">
        <Link
          href="/learning"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#9277AE] transition hover:text-[#80669C]"
        >
          <ArrowLeft size={17} />
          Back to Learning
        </Link>

        {/* Heading */}
        <section className="relative mb-7 overflow-hidden rounded-[28px] border border-[#E9E1F0] bg-gradient-to-br from-[#F4EEF9] via-[#F8F0F5] to-[#F8EBF0] p-6 sm:p-8">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#9277AE]">
              <Library size={14} />
              Your knowledge library
            </div>

            <h1 className="text-3xl font-semibold leading-tight text-[#594B5D] sm:text-4xl">
              Personal Glossary
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#96899E]">
              All the important words and concepts you have collected
              while learning, together in one place.
            </p>
          </div>

          <div className="pointer-events-none absolute -right-4 -top-6 hidden rotate-[-12deg] text-[#CBB8D9]/40 sm:block">
            <BookMarked size={190} strokeWidth={0.7} />
          </div>

          <Sparkles
            size={22}
            className="pointer-events-none absolute bottom-8 right-12 text-[#B79BCB]"
          />
        </section>

        {/* Summary */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-[#E9E1F0] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2EAF7] text-[#9277AE]">
                <Tag size={20} />
              </div>

              <div>
                <p className="text-xs text-[#A397A5]">
                  Saved keywords
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#716083]">
                  {keywords.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#E6EEE6] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF3EC] text-[#78977D]">
                <FileText size={20} />
              </div>

              <div>
                <p className="text-xs text-[#A397A5]">
                  Note connections
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#78977D]">
                  {totalUses}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <div className="relative mb-5">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A397A5]"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search keywords, meanings, examples, or learning paths..."
            className="w-full rounded-xl border border-[#E9E0E8] bg-white py-3.5 pl-11 pr-4 text-sm text-[#625464] outline-none placeholder:text-[#B9AFB9] focus:border-[#B69ACF]"
          />
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Glossary list */}
        {loading ? (
          <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 text-[#A18BAE]">
            <LoaderCircle size={28} className="animate-spin" />
            <p className="text-sm">Opening your glossary...</p>
          </div>
        ) : keywords.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Your glossary is waiting"
            description="When you add keywords and meanings to your learning notes, they will automatically appear here."
          >
            <Link
              href="/learning"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#9277AE] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#80669C]"
            >
              Explore learning paths
            </Link>
          </EmptyState>
        ) : filteredKeywords.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching keywords"
            description="Try another search term."
          >
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-xs font-semibold text-[#9277AE] underline"
            >
              Clear search
            </button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredKeywords.map((keyword) => (
              <article
                key={keyword.id}
                className="rounded-[22px] border border-[#E9E0E8] bg-white p-5 transition hover:border-[#DCCEE7] hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#F2EAF7] px-2.5 py-1 text-[10px] font-semibold text-[#9274B0]">
                        Glossary term
                      </span>

                      <span className="text-[10px] text-[#A397A5]">
                        Used in {keyword.noteCount}{" "}
                        {keyword.noteCount === 1 ? "note" : "notes"}
                      </span>
                    </div>

                    <h2 className="break-words text-lg font-semibold text-[#80669C]">
                      {keyword.name}
                    </h2>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEdit(keyword)}
                      title="Edit keyword"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#9277AE] transition hover:bg-[#F4EEF8]"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={() => handleDelete(keyword)}
                      disabled={deletingId === keyword.id}
                      title="Delete keyword"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[#B77D96] transition hover:bg-[#FBEFF3] disabled:opacity-50"
                    >
                      {deletingId === keyword.id ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#FCFAFD] p-4">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#A18FA6]">
                    Meaning
                  </p>

                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#817487]">
                    {keyword.meaning}
                  </p>
                </div>

                {keyword.example && (
                  <div className="mt-3 rounded-xl bg-[#FBF3F6] p-4">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Lightbulb size={13} className="text-[#B96F91]" />
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B96F91]">
                        Example
                      </p>
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm leading-5 text-[#8C7C85]">
                      {keyword.example}
                    </p>
                  </div>
                )}

                {keyword.notes?.length > 0 && (
                  <div className="mt-4 border-t border-[#F0EAF1] pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#A397A5]">
                      Connected learning notes
                    </p>

                    <div className="space-y-2">
                      {keyword.notes.map((note) => (
                        <Link
                          key={note.id}
                          href={`/learning/${note.learningPathId}`}
                          className="flex items-start gap-2 rounded-lg px-2 py-2 transition hover:bg-[#F8F5FA]"
                        >
                          <BookOpen
                            size={13}
                            className="mt-0.5 shrink-0 text-[#9277AE]"
                          />

                          <div className="min-w-0">
                            <p className="break-words text-xs font-medium text-[#766779]">
                              {note.title || "Untitled note"}
                            </p>
                            <p className="mt-0.5 break-words text-[10px] text-[#A397A5]">
                              {note.learningPathTitle}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-4 text-[10px] text-[#B1A7B2]">
                  Last updated {formatDate(keyword.updatedAt)}
                </p>
              </article>
            ))}
          </div>
        )}

        <p className="mt-7 text-center text-[11px] leading-5 text-[#A397A5]">
          Your glossary is automatically built from the keywords you add
          to your learning notes.
        </p>
      </div>

      {/* Edit modal */}
      {editingKeyword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#3F3345]/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEdit();
            }
          }}
        >
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-[26px] border border-[#E9E0E8] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F2EBEF] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-[#625464]">
                  Edit glossary keyword
                </h2>
                <p className="mt-1 text-xs text-[#A397A5]">
                  Changes will appear in every note using this keyword.
                </p>
              </div>

              <button
                onClick={closeEdit}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#A397A5] transition hover:bg-[#F7F2F7]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#766779]">
                  Keyword name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  className="w-full rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm text-[#625464] outline-none focus:border-[#B69ACF]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#766779]">
                  Meaning *
                </label>
                <textarea
                  rows={4}
                  value={form.meaning}
                  onChange={(event) =>
                    updateField("meaning", event.target.value)
                  }
                  className="w-full resize-y rounded-xl border border-[#E9E0E8] bg-[#FFFCFD] px-4 py-3 text-sm leading-6 text-[#625464] outline-none focus:border-[#B69ACF]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#766779]">
                  Example
                </label>
                <textarea
                  rows={3}
                  value={form.example}
                  onChange={(event) =>
                    updateField("example", event.target.value)
                  }
                  placeholder="Optional example..."
                  className="w-full resize-y rounded-xl border border-[#F0E3E9] bg-[#FFFBFC] px-4 py-3 text-sm leading-6 text-[#625464] outline-none focus:border-[#D9A9BC]"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                  <AlertCircle size={15} />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-[#F2EBEF] pt-4">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={saving}
                  className="rounded-xl border border-[#E9E0E8] px-4 py-2.5 text-xs font-medium text-[#887A8B] transition hover:bg-[#FAF7FA]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#9277AE] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#80669C] disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
