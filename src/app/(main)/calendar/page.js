"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderKanban,
  ListTodo,
  Milestone,
  RefreshCw,
  BookHeart,
} from "lucide-react";

const EVENT_STYLES = {
  TASK: {
    label: "Task",
    color: "bg-[#EDE5F4] text-[#806B94]",
    dot: "bg-[#A58BB8]",
  },
  PROJECT: {
    label: "Project",
    color: "bg-[#E4EFE7] text-[#66866E]",
    dot: "bg-[#8BA58A]",
  },
  MILESTONE: {
    label: "Milestone",
    color: "bg-[#F8EBDD] text-[#A47D43]",
    dot: "bg-[#C5A16B]",
  },
  JOURNAL: {
    label: "Journal",
    color: "bg-[#F8E5EC] text-[#A66F86]",
    dot: "bg-[#D493AC]",
  },
};

const FILTER_OPTIONS = [
  { value: "TASK", label: "Tasks" },
  { value: "PROJECT", label: "Projects" },
  { value: "MILESTONE", label: "Milestones" },
  { value: "JOURNAL", label: "Journal" },
];

function getLocalDateRange(start, end) {
  const from = new Date(start);
  from.setHours(0, 0, 0, 0);

  const to = new Date(end);
  to.setHours(23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function getEventDateKey(date) {
  return format(new Date(date), "yyyy-MM-dd");
}

function getEventDestination(event) {
  if (event.type === "JOURNAL") {
    return `/journal?entry=${encodeURIComponent(event.itemId)}`;
  }

  if (event.type === "PROJECT") {
    return `/projects/${event.itemId}`;
  }

  if (event.type === "MILESTONE") {
    return event.project?.id ? `/projects/${event.project.id}` : "/projects";
  }

  if (event.project?.id) {
    return `/projects/${event.project.id}`;
  }

  return "/tasks";
}

function EventPill({ event, compact = false }) {
  const style = EVENT_STYLES[event.type];

  return (
    <div
      title={`${style.label}: ${event.title}`}
      className={`block w-full truncate rounded-md text-left font-medium ${
        style.color
      } ${compact ? "px-1.5 py-1 text-[10px]" : "px-2.5 py-2 text-xs"}`}
    >
      {event.title}
    </div>
  );
}

export default function CalendarPage() {
  const router = useRouter();

  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    TASK: true,
    PROJECT: true,
    MILESTONE: true,
    JOURNAL: true,
  });

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, {
      weekStartsOn: 1,
    });
    const gridEnd = endOfWeek(monthEnd, {
      weekStartsOn: 1,
    });

    const days = [];
    let day = gridStart;

    while (day <= gridEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const gridStart = startOfWeek(startOfMonth(currentMonth), {
        weekStartsOn: 1,
      });

      const gridEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });

      const range = getLocalDateRange(gridStart, gridEnd);

      const [calendarResponse, journalResponse] = await Promise.all([
        fetch(
          `/api/calendar?from=${encodeURIComponent(
            range.from,
          )}&to=${encodeURIComponent(range.to)}`,
          { cache: "no-store" },
        ),
        fetch("/api/journal", { cache: "no-store" }),
      ]);

      const [calendarData, journalData] = await Promise.all([
        calendarResponse.json(),
        journalResponse.json(),
      ]);

      if (!calendarResponse.ok) {
        throw new Error(
          calendarData.error || "Could not load calendar events.",
        );
      }

      if (!journalResponse.ok) {
        throw new Error(journalData.error || "Could not load journal entries.");
      }

      const calendarEvents = calendarData.events || [];
      const journalEntries = Array.isArray(journalData)
        ? journalData
        : journalData.entries || [];

      const journalEvents = journalEntries
        .filter((entry) => {
          const entryDate = new Date(entry.entryDate);
          return entryDate >= gridStart && entryDate <= gridEnd;
        })
        .map((entry) => ({
          id: `journal-${entry.id}`,
          itemId: entry.id,
          type: "JOURNAL",
          title: entry.title?.trim() || "Journal entry",
          date: entry.entryDate,
          mood: entry.mood,
        }));

      setEvents([...calendarEvents, ...journalEvents]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const visibleEvents = useMemo(
    () => events.filter((event) => filters[event.type]),
    [events, filters],
  );

  const eventsByDate = useMemo(() => {
    const grouped = {};

    for (const event of visibleEvents) {
      const key = getEventDateKey(event.date);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(event);
    }

    return grouped;
  }, [visibleEvents]);

  const selectedDateEvents = useMemo(() => {
    return visibleEvents
      .filter((event) => isSameDay(new Date(event.date), selectedDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [visibleEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return visibleEvents
      .filter(
        (event) => event.type !== "JOURNAL" && new Date(event.date) >= today,
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }, [visibleEvents]);

  function changeMonth(direction) {
    const nextMonth =
      direction === "next"
        ? addMonths(currentMonth, 1)
        : subMonths(currentMonth, 1);

    setCurrentMonth(nextMonth);
    setSelectedDate(startOfMonth(nextMonth));
  }

  function goToToday() {
    const today = new Date();

    setCurrentMonth(startOfMonth(today));
    setSelectedDate(today);
  }

  function toggleFilter(type) {
    setFilters((current) => ({
      ...current,
      [type]: !current[type],
    }));
  }

  function openEvent(event) {
    router.push(getEventDestination(event));
  }

  function getEventIcon(type) {
    if (type === "TASK") return <ListTodo size={15} />;
    if (type === "PROJECT") return <FolderKanban size={15} />;
    if (type === "MILESTONE") return <Milestone size={15} />;
    return <BookHeart size={15} />;
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays size={21} className="text-[#A98297]" />
            <h1 className="text-2xl font-semibold tracking-tight text-[#51464B] sm:text-3xl">
              Calendar
            </h1>
          </div>

          <p className="mt-2 text-sm text-[#9A8D91]">
            Keep track of your tasks, milestones, projects, and journal entries.
          </p>
        </div>

        <button
          type="button"
          onClick={loadEvents}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#EDE1E4] bg-white px-4 py-2.5 text-sm font-semibold text-[#98788A] transition hover:bg-[#FAF4F6] disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_310px]">
        <section className="min-w-0 rounded-3xl border border-[#EFE4E4] bg-white p-4 shadow-[0_8px_30px_rgba(100,70,80,0.035)] sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-[#594A51]">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <p className="mt-1 text-xs text-[#A29499]">
                Select a date to see its scheduled items and journal entries.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg border border-[#EDE2E3] px-3 py-2 text-xs font-semibold text-[#98788A] transition hover:bg-[#FAF4F6]"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => changeMonth("previous")}
                aria-label="Previous month"
                className="rounded-lg border border-[#EDE2E3] p-2 text-[#98788A] transition hover:bg-[#FAF4F6]"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={() => changeMonth("next")}
                aria-label="Next month"
                className="rounded-lg border border-[#EDE2E3] p-2 text-[#98788A] transition hover:bg-[#FAF4F6]"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 border-b border-[#F0E8E8] pb-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-semibold uppercase tracking-wide text-[#A99AA0] sm:text-xs"
              >
                {day}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-[#F0DADA] bg-[#FFF6F5] p-4 text-sm text-[#A45F68]">
              {error}
              <button
                type="button"
                onClick={loadEvents}
                className="ml-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[key] || [];
              const inMonth = isSameMonth(day, currentMonth);
              const selected = isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[100px] min-w-0 border-b border-r border-[#F3ECEB] p-1.5 text-left transition sm:min-h-[125px] sm:p-2.5 ${
                    !inMonth ? "bg-[#FCFAF9]" : "bg-white"
                  } ${
                    selected
                      ? "bg-[#FBF4F7] ring-2 ring-inset ring-[#C9A7B8]"
                      : "hover:bg-[#FCF8F9]"
                  }`}
                >
                  <div className="flex justify-center sm:justify-start">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold sm:h-7 sm:w-7 sm:text-xs ${
                        today
                          ? "bg-[#B78AA0] text-white"
                          : selected
                            ? "bg-[#F0E5EB] text-[#8F6D80]"
                            : inMonth
                              ? "text-[#786970]"
                              : "text-[#C4B9BC]"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEvent(event);
                        }}
                      >
                        <EventPill event={event} compact />
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <p className="px-1 text-[9px] font-medium text-[#A29499] sm:text-[10px]">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {loading && (
            <p className="mt-3 text-center text-xs text-[#A29499]">
              Loading calendar events...
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#F0E8E8] pt-4">
            {FILTER_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-xs text-[#88777F]"
              >
                <input
                  type="checkbox"
                  checked={filters[option.value]}
                  onChange={() => toggleFilter(option.value)}
                  className="accent-[#B78AA0]"
                />
                <span
                  className={`h-2 w-2 rounded-full ${EVENT_STYLES[option.value].dot}`}
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-[#EFE4E4] bg-white p-5 shadow-[0_5px_20px_rgba(100,70,80,0.025)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#594A51]">
                  Selected date
                </h2>
                <p className="mt-1 text-xs text-[#A29499]">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <CalendarDays size={19} className="text-[#B78AA0]" />
            </div>

            <div className="mt-4 space-y-2">
              {selectedDateEvents.length === 0 ? (
                <div className="rounded-2xl bg-[#FBF7F6] px-4 py-7 text-center">
                  <CalendarDays size={24} className="mx-auto text-[#C4A8B5]" />
                  <p className="mt-2 text-xs font-medium text-[#88777F]">
                    Nothing scheduled
                  </p>
                  <p className="mt-1 text-[11px] text-[#A99AA0]">
                    No events or journal entries on this date.
                  </p>
                </div>
              ) : (
                selectedDateEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEvent(event)}
                    className="flex w-full items-start gap-3 rounded-xl border border-[#F0E8E8] p-3 text-left transition hover:bg-[#FCF8F9]"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${EVENT_STYLES[event.type].dot}`}
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-medium text-[#62535A]">
                        {event.title}
                      </span>

                      <span className="mt-1 block text-[11px] text-[#A29499]">
                        {EVENT_STYLES[event.type].label}
                        {event.project?.title
                          ? ` · ${event.project.title}`
                          : ""}
                        {event.mood ? ` · ${event.mood}` : ""}
                      </span>
                    </span>

                    <ChevronRight
                      size={15}
                      className="mt-1 shrink-0 text-[#B7A4AD]"
                    />
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[#EFE4E4] bg-white p-5 shadow-[0_5px_20px_rgba(100,70,80,0.025)]">
            <div className="flex items-center gap-2">
              <Clock3 size={18} className="text-[#A98297]" />
              <h2 className="text-base font-semibold text-[#594A51]">
                Upcoming deadlines
              </h2>
            </div>

            <p className="mt-1 text-xs text-[#A29499]">
              Your next scheduled tasks, milestones, and projects.
            </p>

            <div className="mt-4 space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="rounded-xl bg-[#FBF7F6] px-3 py-5 text-center text-xs text-[#A29499]">
                  No upcoming deadlines found.
                </p>
              ) : (
                upcomingEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openEvent(event)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <div
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${EVENT_STYLES[event.type].color}`}
                    >
                      {getEventIcon(event.type)}
                    </div>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-[#65565D]">
                        {event.title}
                      </span>
                      <span className="mt-1 block text-[10px] text-[#A29499]">
                        {format(new Date(event.date), "MMM d, yyyy")}
                        {" · "}
                        {EVENT_STYLES[event.type].label}
                      </span>
                    </span>

                    <ChevronRight
                      size={14}
                      className="mt-1 shrink-0 text-[#B7A4AD]"
                    />
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
