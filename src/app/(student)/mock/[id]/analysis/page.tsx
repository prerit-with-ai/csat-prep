"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type AnalysisData = {
  mock: {
    id: string;
    type: string;
    netScore: string;
    durationSeconds: number;
    totalTimeSecs: number;
  };
  score: {
    net: number;
    correct: number;
    wrong: number;
    skipped: number;
    total: number;
  };
  abcAnalysis: {
    a: {
      count: number;
      correct: number;
      wrong: number;
      accuracy: number;
    };
    b: {
      count: number;
      attempted: number;
      correct: number;
    };
    c: {
      count: number;
      easySkipped: number;
    };
  };
  wastedTime: Array<{
    displayOrder: number;
    questionText: string;
    timeSpentSeconds: number;
    abcTag: string;
  }>;
  totalTimeSecs: number;
  responses: Array<{
    displayOrder: number;
    questionId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    smartSolution: string;
    detailedSolution: string | null;
    selectedOption: string | null;
    abcTag: string | null;
    isCorrect: boolean | null;
    timeSpentSeconds: number;
    difficulty: string;
  }>;
};

export default function MockAnalysisPage() {
  const { id: mockId } = useParams() as { id: string };
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const response = await fetch(`/api/mock/${mockId}/analysis`);
        if (!response.ok) {
          throw new Error('Failed to load analysis');
        }
        const analysisData = await response.json();
        setData(analysisData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [mockId]);

  const toggleDetailedSolution = (questionId: string) => {
    setExpandedSolutions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const lower = difficulty.toLowerCase();
    if (lower === 'l1') return 'Easy';
    if (lower === 'l2') return 'Medium';
    if (lower === 'l3') return 'Hard';
    return difficulty;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Loading analysis...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-body" style={{ color: 'var(--color-wrong)' }}>
          {error || 'Failed to load analysis'}
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-lg text-body"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const netScore = parseFloat(data.mock.netScore);
  const cutoffScore = 66;
  const cleared = netScore >= cutoffScore;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-body mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        ← Back to Dashboard
      </Link>

      {/* Section 1: Score card */}
      <div className="mb-8">
        <h1 className="text-page-title mb-4" style={{ color: 'var(--text-primary)' }}>
          Mock Complete
        </h1>
        <div className="p-6 rounded-xl mb-4" style={{ border: '1px solid var(--border-default)' }}>
          <p className="text-section mb-3" style={{ color: 'var(--text-primary)' }}>
            Net Score: {data.mock.netScore} / 200
          </p>
          <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--color-correct)' }}>
              Correct: {data.score.correct} (+{(data.score.correct * 2.5).toFixed(2)})
            </span>
            {' | '}
            <span style={{ color: 'var(--color-wrong)' }}>
              Wrong: {data.score.wrong} (-{(data.score.wrong * 0.83).toFixed(2)})
            </span>
            {' | '}
            <span style={{ color: 'var(--text-tertiary)' }}>
              Skipped: {data.score.skipped}
            </span>
          </p>
          <p className="text-body" style={{ color: cleared ? 'var(--color-correct)' : 'var(--color-wrong)' }}>
            Cutoff: {cutoffScore}/200 — {cleared ? 'Cleared' : 'Not cleared yet'}
          </p>
        </div>
      </div>

      {/* Section 2: ABC Analysis */}
      <div className="mb-8">
        <h2 className="text-section mb-4" style={{ color: 'var(--text-primary)' }}>
          ABC Analysis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* A card */}
          <div className="p-4 rounded-xl" style={{ border: '2px solid var(--color-correct)' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-correct)' }}>
              A — Ab Karo
            </p>
            <p className="text-body" style={{ color: 'var(--text-primary)' }}>
              {data.abcAnalysis.a.count} tagged
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {data.abcAnalysis.a.accuracy.toFixed(0)}% accurate
            </p>
          </div>

          {/* B card */}
          <div className="p-4 rounded-xl" style={{ border: '2px solid var(--color-amber)' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-amber)' }}>
              B — Baad mein
            </p>
            <p className="text-body" style={{ color: 'var(--text-primary)' }}>
              {data.abcAnalysis.b.count} tagged
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {data.abcAnalysis.b.attempted} attempted in review
            </p>
          </div>

          {/* C card */}
          <div className="p-4 rounded-xl" style={{ border: '2px solid var(--color-wrong)' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-wrong)' }}>
              C — Chorh Do
            </p>
            <p className="text-body" style={{ color: 'var(--text-primary)' }}>
              {data.abcAnalysis.c.count} tagged
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {data.abcAnalysis.c.easySkipped} were easy (L1/L2)
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Calibration Report */}
      <div className="mb-8">
        <h2 className="text-section mb-1" style={{ color: 'var(--text-primary)' }}>
          Calibration Report
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
          How accurately did your ABC tags reflect your actual ability?
        </p>
        <div className="space-y-3">

          {/* A-tag calibration */}
          {data.abcAnalysis.a.count > 0 && (() => {
            const acc = data.abcAnalysis.a.accuracy;
            const isOverconfident = acc < 70;
            return (
              <div
                className="p-4 rounded-xl flex items-start justify-between gap-4"
                style={{ border: `1px solid ${isOverconfident ? 'var(--color-amber)' : 'var(--border-default)'}` }}
              >
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    A-tag accuracy
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isOverconfident
                      ? `${acc}% accuracy on A-tagged questions. You marked ${data.abcAnalysis.a.wrong} as "confident" but got them wrong.`
                      : `${acc}% accuracy. Your confidence is well-calibrated.`}
                  </p>
                </div>
                <span
                  className="shrink-0 text-sm font-semibold tabular-nums"
                  style={{ color: isOverconfident ? 'var(--color-amber)' : 'var(--color-correct)' }}
                >
                  {acc}%
                </span>
              </div>
            );
          })()}

          {/* C-tag leak */}
          {data.abcAnalysis.c.count > 0 && (() => {
            const leak = data.abcAnalysis.c.easySkipped;
            const leakPct = Math.round(leak / data.abcAnalysis.c.count * 100);
            const hasLeak = leak > 0;
            return (
              <div
                className="p-4 rounded-xl flex items-start justify-between gap-4"
                style={{ border: `1px solid ${hasLeak ? 'var(--color-wrong)' : 'var(--border-default)'}` }}
              >
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    C-tag leak
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {hasLeak
                      ? `${leak} of your ${data.abcAnalysis.c.count} C-tags (${leakPct}%) were L1/L2 questions. These were doable — practice these patterns.`
                      : `All ${data.abcAnalysis.c.count} C-tagged questions were genuinely hard (L3).`}
                  </p>
                </div>
                <span
                  className="shrink-0 text-sm font-semibold tabular-nums"
                  style={{ color: hasLeak ? 'var(--color-wrong)' : 'var(--color-correct)' }}
                >
                  {leak}/{data.abcAnalysis.c.count}
                </span>
              </div>
            );
          })()}

          {/* B-tag throughput */}
          {data.abcAnalysis.b.count > 0 && (() => {
            const throughput = Math.round(data.abcAnalysis.b.attempted / data.abcAnalysis.b.count * 100);
            const bCorrectPct = data.abcAnalysis.b.attempted > 0
              ? Math.round(data.abcAnalysis.b.correct / data.abcAnalysis.b.attempted * 100)
              : 0;
            const lowThroughput = throughput < 60;
            return (
              <div
                className="p-4 rounded-xl flex items-start justify-between gap-4"
                style={{ border: `1px solid ${lowThroughput ? 'var(--color-amber)' : 'var(--border-default)'}` }}
              >
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    B-tag throughput
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {data.abcAnalysis.b.attempted} of {data.abcAnalysis.b.count} B-tagged questions attempted in review.
                    {data.abcAnalysis.b.attempted > 0 && ` ${bCorrectPct}% correct.`}
                    {lowThroughput && ' Manage time better in first pass to leave room for review.'}
                  </p>
                </div>
                <span
                  className="shrink-0 text-sm font-semibold tabular-nums"
                  style={{ color: lowThroughput ? 'var(--color-amber)' : 'var(--color-correct)' }}
                >
                  {throughput}%
                </span>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Section 4: Time analysis */}
      {data.wastedTime.length > 0 && (
        <div className="mb-8">
          <h2 className="text-section mb-4" style={{ color: 'var(--text-primary)' }}>
            Time Analysis
          </h2>
          <div className="p-5 rounded-xl" style={{ border: '1px solid var(--border-default)' }}>
            <p className="text-body mb-3" style={{ color: 'var(--text-secondary)' }}>
              Wasted time: {data.wastedTime.length} question(s) where you spent &gt;3 min and got it wrong.
            </p>
            <div className="space-y-2">
              {data.wastedTime.map((item) => (
                <div key={item.displayOrder} className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Q{item.displayOrder}: {truncate(item.questionText, 60)} — {formatTime(item.timeSpentSeconds)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Question Review */}
      <div className="mb-8">
        <h2 className="text-section mb-4" style={{ color: 'var(--text-primary)' }}>
          Question Review
        </h2>
        <div className="space-y-4">
          {data.responses.map((resp) => {
            const isExpanded = expandedSolutions.has(resp.questionId);
            const abcColor = resp.abcTag === 'A' ? 'var(--color-correct)'
                           : resp.abcTag === 'B' ? 'var(--color-amber)'
                           : resp.abcTag === 'C' ? 'var(--color-wrong)'
                           : 'var(--text-tertiary)';

            const statusIcon = resp.isCorrect === true ? '✓'
                             : resp.isCorrect === false ? '✗'
                             : '—';

            const statusColor = resp.isCorrect === true ? 'var(--color-correct)'
                              : resp.isCorrect === false ? 'var(--color-wrong)'
                              : 'var(--text-tertiary)';

            return (
              <div
                key={resp.questionId}
                className="p-5 rounded-xl"
                style={{ border: '1px solid var(--border-default)' }}
              >
                {/* Question meta */}
                <div className="flex items-center gap-3 mb-3 text-sm flex-wrap">
                  <span style={{ color: 'var(--text-secondary)' }}>Q{resp.displayOrder}</span>
                  <span
                    className="px-2 py-1 rounded font-semibold"
                    style={{ backgroundColor: abcColor, color: '#fff', fontSize: 11 }}
                  >
                    {resp.abcTag || '—'}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {getDifficultyLabel(resp.difficulty)}
                  </span>
                  <span style={{ color: statusColor, fontWeight: 600 }}>
                    {statusIcon} {resp.isCorrect === true ? 'Correct' : resp.isCorrect === false ? 'Incorrect' : 'Skipped'}
                  </span>
                </div>

                {/* Question text */}
                <p className="text-body mb-3" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
                  {resp.questionText}
                </p>

                {/* Answer info */}
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Your answer: {resp.selectedOption || '—'} | Correct: {resp.correctOption}
                </p>

                {/* Smart solution */}
                <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Solution:
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
                    {resp.smartSolution}
                  </p>
                </div>

                {/* Detailed solution toggle */}
                {resp.detailedSolution && (
                  <>
                    <button
                      onClick={() => toggleDetailedSolution(resp.questionId)}
                      className="text-sm underline mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {isExpanded ? 'Hide' : 'Show'} detailed solution →
                    </button>

                    {isExpanded && (
                      <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <p className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
                          {resp.detailedSolution}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/mock"
          className="flex-1 px-6 py-3 rounded-lg text-body text-center"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          Start Another Mock →
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 px-6 py-3 rounded-lg text-body text-center"
          style={{
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
