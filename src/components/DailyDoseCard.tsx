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
        const response = await fetch('/api/daily');
        if (!response.ok) {
          throw new Error('Failed to fetch daily dose');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching daily dose:', error);
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
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
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
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <p className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Daily Dose
        </p>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Unable to load today&apos;s practice. Try refreshing.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm underline"
          style={{ color: 'var(--text-primary)' }}
        >
          Refresh
        </button>
      </div>
    );
  }

  const { dose, answeredQuestionIds, streak } = data;
  const isCompleted = dose.completed;
  const isInProgress = answeredQuestionIds.length > 0 && !isCompleted;
  const isNotStarted = answeredQuestionIds.length === 0 && !isCompleted;

  return (
    <Link
      href="/daily/practice"
      className="block p-5 rounded-xl transition-opacity hover:opacity-80"
      style={{
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div>
        <h3 className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {isCompleted ? 'Daily Dose ✓' : 'Daily Dose'}
        </h3>

        {isNotStarted && (
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {dose.questionCount} questions · Mixed practice
          </p>
        )}

        {isInProgress && (
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Continue ({answeredQuestionIds.length}/{dose.questionCount})
          </p>
        )}

        {isCompleted && (
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Completed · {dose.score}/{dose.questionCount} correct
          </p>
        )}

        {streak > 0 && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            🔥 {streak} day streak
          </p>
        )}

        <p className="text-sm mt-3" style={{ color: 'var(--text-primary)' }}>
          {isNotStarted && "Start today's practice →"}
          {isInProgress && 'Continue →'}
          {isCompleted && 'View Summary →'}
        </p>
      </div>
    </Link>
  );
}
