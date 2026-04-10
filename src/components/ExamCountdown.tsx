"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  examDate: string | null; // ISO string or null
};

function getDaysLeft(examDateStr: string): number {
  const exam = new Date(examDateStr);
  exam.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = exam.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ExamCountdown({ examDate }: Props) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!examDate) return;
    setDaysLeft(getDaysLeft(examDate));
  }, [examDate]);

  if (!examDate) {
    return (
      <Link
        href="/settings"
        className="block rounded-xl px-5 py-4 text-sm"
        style={{
          border: "1px solid var(--border-subtle)",
          color: "var(--text-tertiary)",
        }}
      >
        Set your exam date to see days remaining →
      </Link>
    );
  }

  if (daysLeft === null) return null;

  const examDateFormatted = new Date(examDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const urgencyColor =
    daysLeft <= 30
      ? "var(--color-wrong)"
      : daysLeft <= 90
      ? "var(--color-amber)"
      : "var(--color-correct)";

  if (daysLeft < 0) {
    return (
      <div
        className="rounded-xl px-5 py-4"
        style={{ border: "1px solid var(--border-default)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          CSAT exam was on {examDateFormatted}.{" "}
          <Link href="/settings" style={{ color: "var(--text-secondary)" }}>
            Update date →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl px-5 py-4 flex items-center justify-between"
      style={{ border: "1px solid var(--border-default)" }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          CSAT {examDateFormatted}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          {daysLeft === 0 ? "Today is exam day!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to go`}
        </p>
      </div>
      <div className="text-right">
        <span
          className="text-2xl font-semibold tabular-nums"
          style={{ color: urgencyColor }}
        >
          {daysLeft}
        </span>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          days
        </p>
      </div>
    </div>
  );
}
