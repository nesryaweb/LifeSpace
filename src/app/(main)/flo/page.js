
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CalendarDays,
  Heart,
  LoaderCircle,
  AlertCircle,
  Check,
  Sparkles,
} from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const CYCLES_TO_AVERAGE = 6;

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDateKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDaysToKey(value, days) {
  const date = parseDateKey(value);
  date.setUTCDate(date.getUTCDate() + days);

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function daysBetween(start, end) {
  return Math.round(
    (parseDateKey(end).getTime() - parseDateKey(start).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function formatDate(value) {
  if (!value) return "";

  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTodayKey() {
  const today = new Date();

  return dateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
}

function calculatePrediction(records) {
  if (!records.length) return null;

  const sortedRecords = [...records].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );

  // Use unique start dates so duplicate records do not distort the calculation.
  const uniqueStartDates = [
    ...new Set(sortedRecords.map((record) => record.startDate)),
  ];

  const cycleIntervals = [];

  for (let index = 1; index < uniqueStartDates.length; index++) {
    const interval = daysBetween(
      uniqueStartDates[index - 1],
      uniqueStartDates[index],
    );

    if (interval > 0) {
      cycleIntervals.push(interval);
    }
  }

  // Use the most recent six intervals.
  const recentIntervals = cycleIntervals.slice(-CYCLES_TO_AVERAGE);

  const cycleLength =
    recentIntervals.length > 0
      ? Math.round(
          recentIntervals.reduce((total, value) => total + value, 0) /
            recentIntervals.length,
        )
      : DEFAULT_CYCLE_LENGTH;

  // Estimate bleeding duration from the most recent three records.
  const recentPeriods = sortedRecords.slice(-3);

  const durations = recentPeriods.map(
    (record) => daysBetween(record.startDate, record.endDate) + 1,
  );

  const averageDuration =
    durations.length > 0
      ? Math.round(
          durations.reduce((total, value) => total + value, 0) /
            durations.length,
        )
      : DEFAULT_PERIOD_LENGTH;

  const latestRecord = sortedRecords[sortedRecords.length - 1];

  const nextStartDate = addDaysToKey(
    latestRecord.startDate,
    cycleLength,
  );

  const nextEndDate = addDaysToKey(
    nextStartDate,
    Math.max(1, averageDuration) - 1,
  );

  return {
    nextStartDate,
    nextEndDate,
    cycleLength,
    periodLength: Math.max(1, averageDuration),
    intervalsUsed: recentIntervals.length,
    hasHistory: recentIntervals.length > 0,
    latestStartDate: latestRecord.startDate,
  };
}

export default function FlowPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [boundary, setBoundary] = useState("START");
  const [editingRecord, setEditingRecord] = useState(null);
  const [pendingRecordId, setPendingRecordId] = useState(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Load all years so cycle calculations use complete history.
      const response = await fetch("/api/periods");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load your records.");
      }

      setRecords(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const prediction = useMemo(
    () => calculatePrediction(records),
    [records],
  );

  const openDay = (day) => {
    const record = records.find(
      (item) => item.startDate <= day.key && item.endDate >= day.key,
    );

    setSelectedDay(day.key);
    setEditingRecord(record || null);
    setBoundary("START");
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingRecord(null);
    setSelectedDay("");
    setError("");
  };

  const handleSaveDay = async () => {
    if (!selectedDay) return;

    setSaving(true);
    setError("");

    try {
      let record = editingRecord;

      if (!record && boundary === "END" && pendingRecordId) {
        record = records.find((item) => item.id === pendingRecordId);
      }

      if (!record && boundary === "END") {
        throw new Error("Please select a start day first.");
      }

      let startDate;
      let endDate;

      if (record) {
        startDate =
          boundary === "START" ? selectedDay : record.startDate;

        endDate =
          boundary === "END" ? selectedDay : record.endDate;
      } else {
        startDate = selectedDay;
        endDate = selectedDay;
      }

      if (endDate < startDate) {
        throw new Error(
          boundary === "START"
            ? "The start day cannot be after the end day. Change the end day first."
            : "The end day cannot be before the start day.",
        );
      }

      const response = await fetch(
        record ? `/api/periods/${record.id}` : "/api/periods",
        {
          method: record ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate, endDate }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save this date.");
      }

      if (!record && boundary === "START") {
        setPendingRecordId(data.id);
      }

      if (record && boundary === "END" && record.id === pendingRecordId) {
        setPendingRecordId(null);
      }

      setModalOpen(false);
      setEditingRecord(null);
      setSelectedDay("");

      await loadRecords();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRecord) return;

    if (!window.confirm("Delete this period record?")) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/periods/${editingRecord.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this record.");
      }

      if (pendingRecordId === editingRecord.id) {
        setPendingRecordId(null);
      }

      setModalOpen(false);
      setEditingRecord(null);

      await loadRecords();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const monthData = useMemo(() => {
    return MONTHS.map((month, monthIndex) => {
      const numberOfDays = getDaysInMonth(year, monthIndex);

      return {
        name: month,
        shortName: month.slice(0, 3),
        days: Array.from({ length: numberOfDays }, (_, index) => {
          const day = index + 1;
          const key = dateKey(year, monthIndex, day);

          const record = records.find(
            (item) => item.startDate <= key && item.endDate >= key,
          );

          const isPredicted =
            !record &&
            prediction &&
            key >= prediction.nextStartDate &&
            key <= prediction.nextEndDate;

          return {
            day,
            key,
            record: record || null,
            isPredicted: Boolean(isPredicted),
          };
        }),
      };
    });
  }, [year, records, prediction]);

  const yearRecords = useMemo(() => {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    return records.filter(
      (record) =>
        record.startDate <= yearEnd && record.endDate >= yearStart,
    );
  }, [records, year]);

  const selectedRecord =
    editingRecord ||
    (pendingRecordId
      ? records.find((item) => item.id === pendingRecordId)
      : null);

  const todayKey = getTodayKey();

  const predictionStatus = prediction
    ? prediction.nextStartDate < todayKey
      ? "Your estimated date has passed. Add your next period when it begins to update your prediction."
      : prediction.nextStartDate === todayKey
        ? "Your estimated next period start date is today."
        : "This is an estimate based on your recorded cycle history."
    : "Add your first period to begin tracking and get a prediction.";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pt-10 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#B77D9A]">
            <Heart size={16} />
            Your personal wellness space
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#493B4A]">
            My Flow
          </h1>

          <p className="mt-1 text-sm text-[#938593]">
            Keep track of your cycle, one day at a time.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setSelectedDay("");
            setBoundary("START");
            setError("");
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B77D9A] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#A76D8A]"
        >
          <Plus size={18} />
          Add Period
        </button>
      </div>

      {/* Prediction */}
      <div className="rounded-2xl border border-[#E9DDF0] bg-gradient-to-br from-[#FCF8FE] to-[#F8F2FA] p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDE2F4] text-[#9676AB]">
              <Sparkles size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#6D587C]">
                Your next period estimate
              </p>

              {prediction ? (
                <>
                  <p className="mt-1 text-2xl font-semibold text-[#59475A]">
                    {formatDate(prediction.nextStartDate)}
                  </p>

                  <p className="mt-1 text-xs text-[#98899E]">
                    Estimated period: {formatDate(prediction.nextStartDate)}
                    {" – "}
                    {formatDate(prediction.nextEndDate)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-[#8F8095]">
                  Your prediction will appear after you record your first period.
                </p>
              )}
            </div>
          </div>

          {prediction && (
            <div className="rounded-xl border border-[#E9DDF0] bg-white/80 px-5 py-3 sm:min-w-[145px]">
              <p className="text-xs text-[#9A8AA0]">Estimated cycle</p>
              <p className="mt-1 text-2xl font-semibold text-[#795E8C]">
                {prediction.cycleLength}
                <span className="ml-1 text-xs font-medium">days</span>
              </p>
            </div>
          )}
        </div>

        {prediction && (
          <div className="mt-4 border-t border-[#E9DDF0] pt-3">
            <p className="text-xs leading-relaxed text-[#8F8095]">
              {predictionStatus}
              {" "}
              {prediction.hasHistory
                ? `Calculated from ${prediction.intervalsUsed} recorded cycle ${
                    prediction.intervalsUsed === 1 ? "interval" : "intervals"
                  }.`
                : "Using an initial 28-day estimate until another period is recorded."}
            </p>
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="rounded-2xl border border-[#F0E5EB] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#B19EAE]">
              Yearly overview
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#59475A]">
              {year}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear((value) => value - 1)}
              className="rounded-xl border border-[#F0E5EB] p-2.5 text-[#846F83] hover:bg-[#FAF3F7]"
              aria-label="Previous year"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => setYear((value) => value + 1)}
              className="rounded-xl border border-[#F0E5EB] p-2.5 text-[#846F83] hover:bg-[#FAF3F7]"
              aria-label="Next year"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-[#D98EAE]" />
            <span className="text-xs text-[#887C89]">Recorded period</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-[#DCC9EB]" />
            <span className="text-xs text-[#887C89]">Predicted period</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-[#F3EDF1]" />
            <span className="text-xs text-[#887C89]">Other days</span>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#9C8B9C]">
              <LoaderCircle size={18} className="animate-spin" />
              Loading your year...
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Shared day-number header */}
              <div className="flex items-center gap-3">
                <div className="w-10 shrink-0 sm:w-14" />

                <div className="grid min-w-0 flex-1 grid-cols-[repeat(31,minmax(0,1fr))] gap-[3px]">
                  {Array.from({ length: 31 }, (_, index) => (
                    <div
                      key={index + 1}
                      className="flex aspect-square items-center justify-center"
                    >
                      <span className="text-[9px] font-medium text-[#958697] sm:text-[10px]">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Month rows */}
              {monthData.map((month) => (
                <div key={month.name} className="flex items-center gap-3">
                  <div className="w-10 shrink-0 text-xs font-semibold text-[#756478] sm:w-14 sm:text-sm">
                    {month.shortName}
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-[repeat(31,minmax(0,1fr))] gap-[3px]">
                    {month.days.map((day) => {
                      const isStart = day.record?.startDate === day.key;
                      const isEnd = day.record?.endDate === day.key;

                      return (
                        <button
                          key={day.key}
                          onClick={() => openDay(day)}
                          title={
                            day.record
                              ? `${formatDate(day.record.startDate)} – ${formatDate(day.record.endDate)}`
                              : day.isPredicted
                                ? `Predicted period: ${month.name} ${day.day}`
                                : `${month.name} ${day.day}`
                          }
                          aria-label={`${month.name} ${day.day}${
                            day.record
                              ? ", recorded period day"
                              : day.isPredicted
                                ? ", predicted period day"
                                : ""
                          }`}
                          className={`relative aspect-square min-w-0 rounded-[3px] transition sm:rounded-[5px] ${
                            day.record
                              ? "bg-[#D98EAE] shadow-sm hover:bg-[#C57D9D]"
                              : day.isPredicted
                                ? "bg-[#DCC9EB] hover:bg-[#CBB4DE]"
                                : "bg-[#F3EDF1] hover:bg-[#E9DCE5]"
                          } ${
                            isStart || isEnd
                              ? "ring-1 ring-inset ring-[#A65F82]"
                              : ""
                          }`}
                        >
                          <span className="sr-only">{day.day}</span>
                        </button>
                      );
                    })}

                    {Array.from(
                      { length: 31 - month.days.length },
                      (_, index) => (
                        <span
                          key={`empty-${index}`}
                          className="aspect-square"
                        />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-5 text-xs text-[#A194A0]">
          Click any day to mark it as the start or end of your period.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#F0E5EB] bg-white p-5">
          <div className="flex items-center gap-2 text-[#B77D9A]">
            <CalendarDays size={18} />
            <span className="text-sm font-medium">Recorded periods</span>
          </div>

          <p className="mt-3 text-3xl font-semibold text-[#59475A]">
            {yearRecords.length}
          </p>

          <p className="mt-1 text-xs text-[#9A8B99]">
            Records overlapping {year}
          </p>
        </div>

        <div className="rounded-2xl border border-[#F0E5EB] bg-white p-5">
          <div className="flex items-center gap-2 text-[#B77D9A]">
            <Heart size={18} />
            <span className="text-sm font-medium">Tracking year</span>
          </div>

          <p className="mt-3 text-3xl font-semibold text-[#59475A]">
            {year}
          </p>

          <p className="mt-1 text-xs text-[#9A8B99]">
            Your personal cycle history
          </p>
        </div>
      </div>

      {/* Day selection modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#352936]/35 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-[#F0E5EB] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F9EAF0] text-[#B77D9A]">
                  <Heart size={19} />
                </div>

                <h2 className="text-xl font-semibold text-[#59475A]">
                  {editingRecord ? "Edit period dates" : "Mark a period day"}
                </h2>

                <p className="mt-1 text-sm text-[#9A8B99]">
                  {selectedDay
                    ? formatDate(selectedDay)
                    : "Choose a date to begin."}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-[#9A8B99] hover:bg-[#F8F2F5]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {!selectedDay && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-[#746276]">
                  Choose a date
                </label>

                <input
                  type="date"
                  value={selectedDay}
                  onChange={(event) => setSelectedDay(event.target.value)}
                  className="w-full rounded-xl border border-[#EDE1E9] bg-[#FFFCFE] px-4 py-3 text-sm text-[#59475A] outline-none focus:border-[#C58BA6]"
                />
              </div>
            )}

            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-[#746276]">
                What does this day represent?
              </p>

              <button
                onClick={() => setBoundary("START")}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                  boundary === "START"
                    ? "border-[#D98EAE] bg-[#FDF2F6]"
                    : "border-[#EDE1E9] hover:bg-[#FFFAFC]"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[#59475A]">
                    Start of period
                  </p>
                  <p className="mt-1 text-xs text-[#9A8B99]">
                    Mark the first day of bleeding.
                  </p>
                </div>

                {boundary === "START" && (
                  <Check size={19} className="text-[#B77D9A]" />
                )}
              </button>

              <button
                onClick={() => setBoundary("END")}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                  boundary === "END"
                    ? "border-[#D98EAE] bg-[#FDF2F6]"
                    : "border-[#EDE1E9] hover:bg-[#FFFAFC]"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[#59475A]">
                    End of period
                  </p>
                  <p className="mt-1 text-xs text-[#9A8B99]">
                    Mark the last day of bleeding.
                  </p>
                </div>

                {boundary === "END" && (
                  <Check size={19} className="text-[#B77D9A]" />
                )}
              </button>
            </div>

            {selectedRecord && (
              <div className="mt-4 rounded-xl bg-[#FAF5F8] p-3">
                <p className="text-xs font-medium text-[#8C788C]">
                  Current saved dates
                </p>

                <p className="mt-1 text-sm text-[#59475A]">
                  {formatDate(selectedRecord.startDate)} –{" "}
                  {formatDate(selectedRecord.endDate)}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              {editingRecord && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded-xl border border-red-100 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete record
                </button>
              )}

              <div className="flex flex-1 justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-[#EDE1E9] px-4 py-3 text-sm font-medium text-[#806F80] hover:bg-[#FAF6F8]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveDay}
                  disabled={saving || !selectedDay}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B77D9A] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#A76D8A] disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  Save day
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !modalOpen && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          <span>{error}</span>

          <button
            onClick={loadRecords}
            className="shrink-0 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
