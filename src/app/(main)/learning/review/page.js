
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Eye,
  GraduationCap,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";

function shuffleArray(items) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export default function ReviewPage() {
  const [paths, setPaths] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [selectedPathId, setSelectedPathId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [keywords, setKeywords] = useState([]);
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [knownIds, setKnownIds] = useState([]);
  const [missedIds, setMissedIds] = useState([]);
  const [skippedIds, setSkippedIds] = useState([]);

  const [revealed, setRevealed] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [loadingPaths, setLoadingPaths] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  const [error, setError] = useState("");

  const currentKeyword = deck[currentIndex];

  const selectedPath = paths.find(
    (path) => path.id === selectedPathId
  );

  const selectedLesson = lessons.find(
    (lesson) => lesson.id === selectedLessonId
  );

  const isLoading =
    loadingPaths || loadingLessons || loadingKeywords;

  const answeredCount = knownIds.length + missedIds.length;

  const progress =
    deck.length > 0
      ? Math.min((currentIndex / deck.length) * 100, 100)
      : 0;

  const accuracy =
    answeredCount > 0
      ? Math.round((knownIds.length / answeredCount) * 100)
      : 0;

  const pageSubtitle = useMemo(() => {
    if (!selectedPath) {
      return "Choose a learning path to review the keywords you've collected.";
    }

    if (selectedLesson) {
      return `Reviewing keywords from ${selectedLesson.title}.`;
    }

    return `Reviewing keywords from ${selectedPath.title}.`;
  }, [selectedPath, selectedLesson]);

  // Load learning paths
  useEffect(() => {
    let cancelled = false;

    async function loadPaths() {
      setLoadingPaths(true);
      setError("");

      try {
        const response = await fetch("/api/learning");

        if (!response.ok) {
          throw new Error("Could not load your learning paths.");
        }

        const data = await response.json();

        const pathList = Array.isArray(data)
          ? data
          : data.paths || data.learningPaths || [];

        if (!cancelled) {
          setPaths(pathList);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoadingPaths(false);
        }
      }
    }

    loadPaths();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load lessons for selected path
  useEffect(() => {
    let cancelled = false;

    async function loadLessons() {
      if (!selectedPathId) {
        setLessons([]);
        setLoadingLessons(false);
        return;
      }

      setLoadingLessons(true);
      setLessons([]);
      setSelectedLessonId("");

      try {
        const response = await fetch(
          `/api/learning/${selectedPathId}/lessons`
        );

        if (!response.ok) {
          throw new Error("Could not load lessons.");
        }

        const data = await response.json();

        const lessonList = Array.isArray(data)
          ? data
          : data.lessons || [];

        if (!cancelled) {
          setLessons(lessonList);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load lessons.");
        }
      } finally {
        if (!cancelled) {
          setLoadingLessons(false);
        }
      }
    }

    loadLessons();

    return () => {
      cancelled = true;
    };
  }, [selectedPathId]);

  // Load keywords for selected path and optional lesson
  useEffect(() => {
    let cancelled = false;

    async function loadKeywords() {
      if (!selectedPathId) {
        setKeywords([]);
        setDeck([]);
        setCurrentIndex(0);
        setShowResults(false);
        setLoadingKeywords(false);
        return;
      }

      setLoadingKeywords(true);
      setError("");

      setKeywords([]);
      setDeck([]);
      setCurrentIndex(0);
      setKnownIds([]);
      setMissedIds([]);
      setSkippedIds([]);
      setRevealed(false);
      setShowResults(false);

      try {
        const params = new URLSearchParams({
          learningPathId: selectedPathId,
        });

        if (selectedLessonId) {
          params.set("lessonId", selectedLessonId);
        }

        const response = await fetch(
          `/api/learning/keywords?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Could not load keywords for this selection.");
        }

        const data = await response.json();
        const keywordList = data.keywords || [];

        if (!cancelled) {
          setKeywords(keywordList);
          setDeck(shuffleArray(keywordList));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load keywords.");
        }
      } finally {
        if (!cancelled) {
          setLoadingKeywords(false);
        }
      }
    }

    loadKeywords();

    return () => {
      cancelled = true;
    };
  }, [selectedPathId, selectedLessonId]);

  function resetSession() {
    setDeck(shuffleArray(keywords));
    setCurrentIndex(0);
    setKnownIds([]);
    setMissedIds([]);
    setSkippedIds([]);
    setRevealed(false);
    setShowResults(false);
  }

  function handlePathChange(value) {
    setSelectedPathId(value);
    setSelectedLessonId("");
    setLessons([]);
    setKeywords([]);
    setDeck([]);
    setCurrentIndex(0);
    setKnownIds([]);
    setMissedIds([]);
    setSkippedIds([]);
    setRevealed(false);
    setShowResults(false);
    setError("");

    if (value) {
      setFiltersOpen(false);
    }
  }

  function handleLessonChange(value) {
    setSelectedLessonId(value);
  }

  function moveToNextCard() {
    setRevealed(false);

    if (currentIndex + 1 >= deck.length) {
      setCurrentIndex(deck.length);
      setShowResults(true);
    } else {
      setCurrentIndex((previous) => previous + 1);
    }
  }

  function markKnown() {
    if (!currentKeyword) return;

    setKnownIds((previous) =>
      previous.includes(currentKeyword.id)
        ? previous
        : [...previous, currentKeyword.id]
    );

    moveToNextCard();
  }

  function markMissed() {
    if (!currentKeyword) return;

    setMissedIds((previous) =>
      previous.includes(currentKeyword.id)
        ? previous
        : [...previous, currentKeyword.id]
    );

    moveToNextCard();
  }

  function skipCard() {
    if (!currentKeyword) return;

    setSkippedIds((previous) =>
      previous.includes(currentKeyword.id)
        ? previous
        : [...previous, currentKeyword.id]
    );

    moveToNextCard();
  }

  function reviewMissed() {
    const missedKeywords = keywords.filter((keyword) =>
      missedIds.includes(keyword.id)
    );

    if (missedKeywords.length === 0) return;

    setDeck(shuffleArray(missedKeywords));
    setCurrentIndex(0);
    setKnownIds([]);
    setMissedIds([]);
    setSkippedIds([]);
    setRevealed(false);
    setShowResults(false);
  }

  function reviewSkipped() {
    const skippedKeywords = keywords.filter((keyword) =>
      skippedIds.includes(keyword.id)
    );

    if (skippedKeywords.length === 0) return;

    setDeck(shuffleArray(skippedKeywords));
    setCurrentIndex(0);
    setKnownIds([]);
    setMissedIds([]);
    setSkippedIds([]);
    setRevealed(false);
    setShowResults(false);
  }

  return (
    < className="min-h-screen px-4 py-6 text-[#51434A] sm:px-7 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/learning"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#9B8490] transition hover:text-[#B87893]"
          >
            <ArrowLeft size={16} />
            Back to Learning
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4E7F5] text-[#9274B0]">
                  <Brain size={21} />
                </div>

                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A58D9A]">
                  Learning tools
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-[#51434A] sm:text-4xl">
                Review & Recall
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#927F88]">
                {pageSubtitle}
              </p>
            </div>

            <Link
              href="/learning/glossary"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#EADCE4] bg-white px-4 py-2.5 text-sm font-medium text-[#876D7A] shadow-sm transition hover:border-[#DDBACB] hover:bg-[#FFF9FC]"
            >
              <BookOpen size={16} />
              Open glossary
            </Link>
          </div>
        </div>

        {/* Collapsible learning filters */}
        <div className="mb-5 rounded-2xl border border-[#F0E2E9] bg-white/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <GraduationCap
                size={17}
                className="shrink-0 text-[#B87893]"
              />

              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#604D57]">
                  {selectedPath
                    ? selectedPath.title
                    : "Choose what to review"}
                </p>

                <p className="truncate text-[11px] text-[#A58D9A]">
                  {selectedPath
                    ? selectedLesson
                      ? selectedLesson.title
                      : "All lessons"
                    : "Select a learning path and lesson"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((previous) => !previous)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#A96783] transition hover:bg-[#FFF3F7]"
            >
              {filtersOpen ? "Done" : "Change"}

              <ChevronDown
                size={14}
                className={`transition-transform ${
                  filtersOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {filtersOpen && (
            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#F2E8ED] pt-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#9B8490]">
                  Learning path
                </label>

                <select
                  value={selectedPathId}
                  onChange={(event) =>
                    handlePathChange(event.target.value)
                  }
                  disabled={loadingPaths}
                  className="w-full rounded-lg border border-[#EADCE4] bg-[#FFFBFD] px-3 py-2.5 text-xs text-[#604D57] outline-none focus:border-[#D5A8BC] disabled:opacity-60"
                >
                  <option value="">Select a learning path</option>

                  {paths.map((path) => (
                    <option key={path.id} value={path.id}>
                      {path.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-[#9B8490]">
                  Lesson <span className="font-normal">(optional)</span>
                </label>

                <select
                  value={selectedLessonId}
                  onChange={(event) =>
                    handleLessonChange(event.target.value)
                  }
                  disabled={!selectedPathId || loadingLessons}
                  className="w-full rounded-lg border border-[#EADCE4] bg-[#FFFBFD] px-3 py-2.5 text-xs text-[#604D57] outline-none focus:border-[#D5A8BC] disabled:opacity-50"
                >
                  <option value="">
                    {!selectedPathId
                      ? "Choose a path first"
                      : loadingLessons
                        ? "Loading lessons..."
                        : "All lessons"}
                  </option>

                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#F0D5D8] bg-[#FFF5F5] p-4 text-sm text-[#A45F68]">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="rounded-3xl border border-[#F0E2E9] bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-[#EADCE4] border-t-[#B87893]" />
            <p className="text-sm text-[#927F88]">
              {loadingPaths
                ? "Loading learning paths..."
                : loadingLessons
                  ? "Loading lessons..."
                  : "Preparing your review cards..."}
            </p>
          </div>
        )}

        {/* No path selected */}
        {!isLoading && !selectedPathId && (
          <div className="rounded-3xl border border-dashed border-[#E5CDD9] bg-[#FFFAFC] px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F4E7F5] text-[#9274B0]">
              <GraduationCap size={28} />
            </div>

            <h2 className="text-lg font-semibold text-[#604D57]">
              Choose a learning path
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#9B8490]">
              Your review cards will come only from the learning path you
              select. You can also narrow the session down to one lesson.
            </p>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="mt-5 rounded-xl bg-[#B87893] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A96783]"
            >
              Choose learning path
            </button>
          </div>
        )}

        {/* No keywords */}
        {!isLoading &&
          selectedPathId &&
          keywords.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[#E5CDD9] bg-[#FFFAFC] px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F4E7F5] text-[#9274B0]">
                <BookOpen size={27} />
              </div>

              <h2 className="text-lg font-semibold text-[#604D57]">
                No keywords to review yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#9B8490]">
                Add keywords with their meanings to your notes in this
                learning path. They will appear here automatically.
              </p>

              <Link
                href={`/learning/${selectedPathId}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B87893] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A96783]"
              >
                Open learning path
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

        {/* Flashcard */}
        {!isLoading &&
          keywords.length > 0 &&
          !showResults &&
          currentKeyword && (
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#78636E]">
                    Card {currentIndex + 1} of {deck.length}
                  </p>

                  <p className="mt-1 text-xs text-[#AA96A0]">
                    {answeredCount} answered · {skippedIds.length} skipped
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetSession}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#9B8490] transition hover:bg-[#F9EFF4] hover:text-[#A96783]"
                >
                  <RotateCcw size={14} />
                  Restart session
                </button>
              </div>

              <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#F1E6EB]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#DDAFC3] to-[#B69ACF] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="overflow-hidden rounded-[30px] border border-[#EEDFE7] bg-white shadow-[0_10px_35px_rgba(111,77,91,0.06)]">
                <div className="flex items-center justify-between border-b border-[#F2E8ED] bg-[#FFFAFC] px-5 py-4 sm:px-8">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#A58D9A]">
                    <Sparkles size={15} />
                    Remember this term
                  </div>

                  <span className="rounded-full bg-[#F1EAF6] px-3 py-1 text-xs font-medium text-[#9274B0]">
                    {selectedLesson ? "Lesson review" : "Path review"}
                  </span>
                </div>

                <div className="px-6 py-12 text-center sm:px-12 sm:py-16">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#B69AA8]">
                    What does this mean?
                  </p>

                  <h2 className="mx-auto max-w-2xl break-words text-3xl font-semibold leading-tight text-[#604D57] sm:text-4xl">
                    {currentKeyword.name}
                  </h2>

                  {revealed ? (
                    <div className="mx-auto mt-8 max-w-2xl">
                      <div className="rounded-2xl bg-[#F8F1F7] p-5 text-left sm:p-6">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9274B0]">
                          Meaning
                        </p>

                        <p className="whitespace-pre-wrap text-base leading-7 text-[#604D57]">
                          {currentKeyword.meaning}
                        </p>

                        {currentKeyword.example && (
                          <div className="mt-5 border-t border-[#E8DCEB] pt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9274B0]">
                              Example
                            </p>

                            <p className="whitespace-pre-wrap text-sm leading-6 text-[#78636E]">
                              {currentKeyword.example}
                            </p>
                          </div>
                        )}
                      </div>

                      {currentKeyword.notes?.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-[#F0E2E9] bg-[#FFFBFD] p-4 text-left">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#A58D9A]">
                            Where you learned it
                          </p>

                          <div className="flex flex-col gap-2">
                            {currentKeyword.notes.map((note) => (
                              <div
                                key={note.noteId}
                                className="flex items-start gap-2 text-sm text-[#78636E]"
                              >
                                <BookOpen
                                  size={15}
                                  className="mt-0.5 shrink-0 text-[#B87893]"
                                />

                                <div>
                                  <p className="font-medium">
                                    {note.noteTitle || "Untitled note"}
                                  </p>

                                  {note.lessonTitle && (
                                    <p className="mt-0.5 text-xs text-[#A58D9A]">
                                      {note.lessonTitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-8">
                      <p className="text-sm text-[#A58D9A]">
                        Try to remember the meaning before revealing it.
                      </p>

                      <button
                        type="button"
                        onClick={() => setRevealed(true)}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B87893] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#A96783]"
                      >
                        <Eye size={17} />
                        Reveal meaning
                      </button>
                    </div>
                  )}
                </div>

                {revealed && (
                  <div className="border-t border-[#F2E8ED] bg-[#FFFAFC] p-5 sm:p-6">
                    <p className="mb-4 text-center text-xs font-medium text-[#9B8490]">
                      How well did you remember this?
                    </p>

                    <div className="mx-auto grid max-w-lg grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={markMissed}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#F0D5D8] bg-white px-4 py-3 text-sm font-semibold text-[#B56F79] transition hover:bg-[#FFF3F3]"
                      >
                        <XCircle size={17} />
                        Still learning
                      </button>

                      <button
                        type="button"
                        onClick={markKnown}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#D7E8D9] bg-white px-4 py-3 text-sm font-semibold text-[#6F987A] transition hover:bg-[#F3FAF3]"
                      >
                        <CheckCircle2 size={17} />
                        I knew it
                      </button>
                    </div>
                  </div>
                )}

                {!revealed && (
                  <div className="border-t border-[#F2E8ED] bg-[#FFFAFC] px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={skipCard}
                      className="text-xs font-medium text-[#A58D9A] transition hover:text-[#A96783]"
                    >
                      Skip for now
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

        {/* Results */}
        {!isLoading &&
          keywords.length > 0 &&
          showResults && (
            <section className="rounded-3xl border border-[#EEDFE7] bg-white p-6 shadow-[0_10px_35px_rgba(111,77,91,0.05)] sm:p-9">
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F1EAF6] text-[#9274B0]">
                  <Sparkles size={29} />
                </div>

                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#A58D9A]">
                  Session complete
                </p>

                <h2 className="text-2xl font-semibold text-[#604D57] sm:text-3xl">
                  Well done!
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#927F88]">
                  You reached the end of this review session. Keep revisiting
                  the terms that are still difficult.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-[#F4F8F3] p-4">
                    <p className="text-2xl font-semibold text-[#6F987A]">
                      {knownIds.length}
                    </p>
                    <p className="mt-1 text-xs text-[#8BA391]">
                      Knew it
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FFF3F3] p-4">
                    <p className="text-2xl font-semibold text-[#B56F79]">
                      {missedIds.length}
                    </p>
                    <p className="mt-1 text-xs text-[#B98A90]">
                      Still learning
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F5F0F8] p-4">
                    <p className="text-2xl font-semibold text-[#9274B0]">
                      {skippedIds.length}
                    </p>
                    <p className="mt-1 text-xs text-[#A18AB4]">
                      Skipped
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FFF8EF] p-4">
                    <p className="text-2xl font-semibold text-[#B68D58]">
                      {accuracy}%
                    </p>
                    <p className="mt-1 text-xs text-[#B69A75]">
                      Accuracy
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                  {missedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={reviewMissed}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B87893] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A96783]"
                    >
                      <RotateCcw size={16} />
                      Review missed ({missedIds.length})
                    </button>
                  )}

                  {skippedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={reviewSkipped}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EADCE4] bg-white px-5 py-3 text-sm font-semibold text-[#876D7A] transition hover:bg-[#FFF9FC]"
                    >
                      Review skipped ({skippedIds.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={resetSession}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#EADCE4] bg-white px-5 py-3 text-sm font-semibold text-[#876D7A] transition hover:bg-[#FFF9FC]"
                  >
                    <RotateCcw size={16} />
                    Start again
                  </button>
                </div>
              </div>
            </section>
          )}
      </div>
    </main>
  );
}
