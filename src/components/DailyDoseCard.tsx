"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DailyDose = {
  id: string;
  date: string;
  completed: boolean;
  score: number | null;
  questionCount: number;
};

type DailyDoseData = {
  dose: DailyDose;
  answeredQuestionIds: string[];
  streak: number;
};

export default function DailyDoseCard() {
  const [data, setData] = useState<DailyDoseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyDose = async () => {
      try {
        const response = await fetch("/api/daily");
        if (!response.ok) throw new Error("Failed to fetch daily dose");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching daily dose:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyDose();
  }, []);

  if (loading) {
    return (
      <div
        className="p-5 rounded-xl"
        style={{
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="p-5 rounded-xl"
        style={{
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <p className="text-base font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          Daily Dose
        </p>
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
          Unable to load today&apos;s practice. Try refreshing.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm underline"
          style={{ color: "var(--text-primary)" }}
        >
          Refresh
        </button>
      </div>
    );
  }

  const { dose, answeredQuestionIds, streak } = data;
  const total = dose.questionCount;
  const done = answeredQuestionIds.length;
  const isCompleted = dose.completed;
  const isInProgress = done > 0 && !isCompleted;
  const isNotStarted = done === 0 && !isCompleted;

  return (
    <Link
      href="/daily/practice"
      className="block rounded-xl transition-opacity hover:opacity-90"
      style={{
        backgroundColor: "var(--color-amber-bg)",
        border: "1px solid var(--color-amber)",
        padding: "20px",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {isCompleted ? "Daily Dose ✓" : "Daily Dose"}
          </span>
          {streak > 0 && (
            <span
              data-testid="dose-streak"
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--color-amber)",
                color: "#fff",
              }}
            >
              🔥 {streak}
            </span>
          )}
        </div>
        <span className="text-sm" style={{ color: "var(--color-amber)" }}>
          {isCompleted
            ? `${dose.score ?? done}/${total}`
            : `${done} of ${total}`}
        </span>
      </div>

      {/* Progress bar — 18 segments */}
      <div
        data-testid="dose-progress"
        className="flex gap-0.5 mb-3"
        aria-label={`${done} of ${total} questions done`}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: "6px",
              backgroundColor: i < done
                ? "var(--color-amber)"
                : "var(--border-default)",
            }}
          />
        ))}
      </div>

      {/* CTA */}
      <p className="text-sm font-medium" style={{ color: "var(--color-amber)" }}>
        {isNotStarted && "Start today's practice →"}
        {isInProgress && "Continue →"}
        {isCompleted && "View Summary →"}
      </p>
    </Link>
  );
}
