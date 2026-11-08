
"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
} from "lucide-react";

function toDateKey(value) {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function JournalCalendar({
  entries = [],
  selectedDate,
  onSelectDate,
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday-first calendar
  const firstDayOffset =
    (new Date(year, month, 1).getDay() + 6) % 7;

  const calendarCells = useMemo(() => {
    const cells = [];

    for (let i = 0; i < firstDayOffset; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [firstDayOffset, daysInMonth]);

  const entryCounts = useMemo(() => {
    const counts = {};

    entries.forEach((entry) => {
      const key = toDateKey(entry.entryDate);
      counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
  }, [entries]);

  const todayKey = toDateKey(new Date());

  function changeMonth(amount) {
    setCurrentMonth(
      new Date(year, month + amount, 1)
    );
  }

  function handleDayClick(day) {
    if (!day) return;

    const key = [
      year,
      String(month + 1).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");

    onSelectDate(selectedDate === key ? null : key);
  }

  return (
    <section className="rounded-[24px] border border-[#EFE6E9] bg-white p-5 shadow-[0_3px_14px_rgba(93,65,79,0.035)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EAF0] text-[#B17D96]">
            <CalendarDays size={19} />
          </div>

          <div>
            <h2 className="font-semibold text-[#5D5057]">
              Journal calendar
            </h2>
            <p className="text-xs text-[#A09299]">
              Your memories, day by day
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth(-1)}
            className="rounded-lg p-2 text-[#9C8490] transition hover:bg-[#F8EDF2]"
            aria-label="Previous month"
          >
            <ChevronLeft size={19} />
          </button>

          <span className="min-w-32 text-center text-sm font-medium text-[#695761]">
            {monthName}
          </span>

          <button
            onClick={() => changeMonth(1)}
            className="rounded-lg p-2 text-[#9C8490] transition hover:bg-[#F8EDF2]"
            aria-label="Next month"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
          (day) => (
            <div
              key={day}
              className="py-2 text-[11px] font-semibold text-[#B09FA7]"
            >
              {day}
            </div>
          )
        )}

        {calendarCells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />;
          }

          const key = [
            year,
            String(month + 1).padStart(2, "0"),
            String(day).padStart(2, "0"),
          ].join("-");

          const count = entryCounts[key] || 0;
          const isSelected = selectedDate === key;
          const isToday = todayKey === key;

          return (
            <button
              key={key}
              onClick={() => handleDayClick(day)}
              className={`relative flex min-h-11 flex-col items-center justify-center rounded-xl text-sm transition ${
                isSelected
                  ? "bg-[#B77F9A] font-semibold text-white"
                  : count
                    ? "bg-[#F8EAF0] font-medium text-[#986B82] hover:bg-[#F2DCE6]"
                    : "text-[#82747B] hover:bg-[#FAF3F6]"
              }`}
              title={
                count
                  ? `${count} ${count === 1 ? "entry" : "entries"}`
                  : `No entries on ${key}`
              }
            >
              <span
                className={
                  isToday && !isSelected
                    ? "font-bold underline decoration-[#B77F9A] decoration-2 underline-offset-4"
                    : ""
                }
              >
                {day}
              </span>

              {count > 0 && (
                <span
                  className={`mt-0.5 h-1 w-1 rounded-full ${
                    isSelected ? "bg-white" : "bg-[#B77F9A]"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F2EAED] pt-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#A09299]">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F3DCE6]" />
            Entry written
          </span>

          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[#B77F9A]" />
            Today
          </span>
        </div>

        {selectedDate && (
          <button
            onClick={() => onSelectDate(null)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#A66F89] hover:text-[#87546D]"
          >
            <X size={13} />
            Clear date filter
          </button>
        )}
      </div>
    </section>
  );
}
