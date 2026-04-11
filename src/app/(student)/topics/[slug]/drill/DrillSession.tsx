"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const MASTERY_THRESHOLD = 3; // consecutive correct answers

type PatternType = {
  id: string;
  name: string;
  description: string | null;
};

type Topic = {
  id: string;
  name: string;
};

type DrillQuestion = {
  id: string;
  topicId: string;
  patternTypeId: string | null;
  difficulty: string;
  questionText: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type Solution = {
  isCorrect: boolean;
  correctOption: string;
  smartSolution: string;
  detailedSolution: string | null;
  optionAExplanation: string | null;
  optionBExplanation: string | null;
  optionCExplanation: string | null;
  optionDExplanation: string | null;
};

type DrillPhase =
  | "pick-pattern"
  | "loading"
  | "answering"
  | "submitting"
  | "solution"
  | "mastered"
  | "exhausted";

type Stats = {
  attempted: number;
  correct: number;
  streak: number;
};

type Props = {
  topic: Topic;
  patterns: PatternType[];
};

export function DrillSession({ topic, patterns }: Props) {
  const [phase, setPhase] = useState<DrillPhase>("pick-pattern");
  const [selectedPattern, setSelectedPattern] = useState<PatternType | null>(null);
  const [question, setQuestion] = useState<DrillQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [stats, setStats] = useState<Stats>({ attempted: 0, correct: 0, streak: 0 });
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [showDetailed, setShowDetailed] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (phase === "answering" || phase === "submitting") {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, question?.id]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const getDifficultyLabel = (d: string) => {
    if (d === "l1") return "Easy";
    if (d === "l2") return "Medium";
    if (d === "l3") return "Hard";
    return d;
  };

  const loadQuestion = async (patternTypeId: string, exclude: string[]) => {
    setPhase("loading");
    setShowDetailed(false);
    setSelectedOption(null);
    setSolution(null);

    const res = await fetch("/api/drill/serve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patternTypeId, excludeIds: exclude }),
    });

    const data = await res.json();

    if (!data.question) {
      setPhase("exhausted");
      return;
    }

    setQuestion(data.question);
    setPhase("answering");
  };

  const startDrill = async (pattern: PatternType) => {
    setSelectedPattern(pattern);
    setStats({ attempted: 0, correct: 0, streak: 0 });
    setSeenIds([]);
    await loadQuestion(pattern.id, []);
  };

  const submitAnswer = async () => {
    if (!question || !selectedOption || phase !== "answering") return;
    setPhase("submitting");

    const timeSpent = elapsedSeconds;

    const res = await fetch("/api/practice/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: question.id,
        topicId: question.topicId,
        selectedOption,
        timeSpent,
      }),
    });

    const sol: Solution = await res.json();
    setSolution(sol);

    const newStreak = sol.isCorrect ? stats.streak + 1 : 0;
    const newStats: Stats = {
      attempted: stats.attempted + 1,
      correct: stats.correct + (sol.isCorrect ? 1 : 0),
      streak: newStreak,
    };
    setStats(newStats);
    setSeenIds((prev) => [...prev, question.id]);

    if (newStreak >= MASTERY_THRESHOLD) {
      setPhase("mastered");
    } else {
      setPhase("solution");
    }
  };

  const nextQuestion = () => {
    if (!selectedPattern) return;
    loadQuestion(selectedPattern.id, seenIds);
  };

  const getOptionStyle = (key: string) => {
    if (phase === "answering" || phase === "submitting") {
      return selectedOption === key
        ? { border: "2px solid var(--text-primary)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }
        : { border: "1px solid var(--border-default)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" };
    }
    const correct = solution?.correctOption?.toUpperCase();
    const chosen = selectedOption?.toUpperCase();
    if (key === correct) {
      return { border: "1px solid var(--color-correct)", backgroundColor: "var(--color-correct-bg)", color: "var(--color-correct)" };
    }
    if (key === chosen && key !== correct) {
      return { border: "2px solid var(--color-wrong)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" };
    }
    return { border: "1px solid var(--border-default)", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" };
  };

  // ── Pattern picker ──────────────────────────────────────────────────────────
  if (phase === "pick-pattern") {
    return (
      <div>
        <h1 className="text-page-title mb-1">Drill Mode</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
          {topic.name} · Pick a pattern to drill until mastery ({MASTERY_THRESHOLD} correct in a row)
        </p>
        <div className="space-y-2">
          {patterns.map((p) => (
            <button
              key={p.id}
              onClick={() => startDrill(p)}
              className="w-full text-left p-4 rounded-xl transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-primary)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-primary)")}
            >
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {p.name}
              </p>
              {p.description && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {p.description}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading…</p>
      </div>
    );
  }

  // ── Mastered ────────────────────────────────────────────────────────────────
  if (phase === "mastered") {
    const accuracy = stats.attempted > 0 ? Math.round(stats.correct / stats.attempted * 100) : 0;
    return (
      <div className="text-center py-12">
        <p className="text-section mb-2" style={{ color: "var(--color-correct)" }}>
          Pattern mastered
        </p>
        <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
          {MASTERY_THRESHOLD} correct in a row
        </p>
        <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>
          {stats.correct}/{stats.attempted} correct ({accuracy}%) · {selectedPattern?.name}
        </p>
        <div className="flex flex-col gap-3">
          {patterns.length > 1 && (
            <Button
              variant="primary"
              onClick={() => setPhase("pick-pattern")}
              className="w-full px-6 py-3"
            >
              Drill another pattern
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => { setStats({ attempted: 0, correct: 0, streak: 0 }); setSeenIds([]); selectedPattern && loadQuestion(selectedPattern.id, []); }}
            className="w-full px-6 py-3"
          >
            Drill this pattern again
          </Button>
        </div>
      </div>
    );
  }

  // ── Exhausted ───────────────────────────────────────────────────────────────
  if (phase === "exhausted") {
    return (
      <div className="text-center py-12">
        <p className="text-section mb-2">No more questions</p>
        <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>
          You've seen all available questions for this pattern.
        </p>
        <Button
          variant="primary"
          onClick={() => setPhase("pick-pattern")}
          className="w-full px-6 py-3"
        >
          Pick another pattern
        </Button>
      </div>
    );
  }

  // ── Active drill (answering / submitting / solution) ────────────────────────
  const isAnswering = phase === "answering";
  const isSolution = phase === "solution";
  const options = question
    ? [
        { key: "A", text: question.optionA },
        { key: "B", text: question.optionB },
        { key: "C", text: question.optionC },
        { key: "D", text: question.optionD },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-section mb-0.5">{selectedPattern?.name}</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {stats.attempted} done · {stats.correct} correct · {stats.streak}/{MASTERY_THRESHOLD} streak
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAnswering && (
            <span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
              ⏱ {formatTime(elapsedSeconds)}
            </span>
          )}
          {question && (
            <span
              className="text-xs font-semibold px-2 py-1 rounded"
              style={{
                backgroundColor:
                  question.difficulty === "l1" ? "var(--level-l1)"
                  : question.difficulty === "l2" ? "var(--level-l2)"
                  : "var(--level-l3)",
                color: "#fff",
              }}
            >
              {question && getDifficultyLabel(question.difficulty)}
            </span>
          )}
        </div>
      </div>

      {/* Streak progress */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: MASTERY_THRESHOLD }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{
              backgroundColor: i < stats.streak ? "var(--color-correct)" : "var(--border-default)",
            }}
          />
        ))}
      </div>

      {/* Question */}
      {question && (
        <div className="mb-6 p-5 rounded-xl" style={{ border: "1px solid var(--border-default)" }}>
          <p className="text-body" style={{ color: "var(--text-primary)", lineHeight: "1.7" }}>
            {question.questionText}
          </p>
          {question.imageUrl && (
            <img src={question.imageUrl} alt="Question" className="mt-4 max-w-full rounded-lg" />
          )}
        </div>
      )}

      {/* Options */}
      <div className="mb-6 space-y-3">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => isAnswering && setSelectedOption(opt.key)}
            disabled={!isAnswering}
            className="w-full p-4 rounded-lg text-left transition-all text-body"
            style={getOptionStyle(opt.key)}
          >
            <span className="font-semibold">{opt.key}.</span> {opt.text}
          </button>
        ))}
      </div>

      {/* Result banner + solution */}
      {isSolution && solution && (
        <>
          <div
            className="mb-4 p-4 rounded-xl text-center"
            style={{
              backgroundColor: solution.isCorrect ? "var(--color-correct-bg)" : "var(--color-wrong-bg)",
              color: solution.isCorrect ? "var(--color-correct)" : "var(--color-wrong)",
            }}
          >
            <p className="text-body font-semibold">
              {solution.isCorrect ? "✓ Correct" : "✗ Incorrect"}
            </p>
          </div>

          <div className="mb-4 p-5 rounded-xl" style={{ border: "1px solid var(--border-default)" }}>
            <h3 className="text-section mb-2" style={{ color: "var(--text-primary)" }}>
              Solution
            </h3>
            <p className="text-body" style={{ color: "var(--text-primary)", lineHeight: "1.7" }}>
              {solution.smartSolution}
            </p>
          </div>

          {solution.detailedSolution && (
            <>
              <button
                onClick={() => setShowDetailed(!showDetailed)}
                className="mb-4 text-body underline"
                style={{ color: "var(--text-primary)" }}
              >
                {showDetailed ? "Hide" : "Show"} detailed solution
              </button>
              {showDetailed && (
                <div
                  className="mb-4 p-5 rounded-xl"
                  style={{ border: "1px solid var(--border-default)", backgroundColor: "var(--bg-secondary)" }}
                >
                  <p className="text-body" style={{ color: "var(--text-primary)", lineHeight: "1.7" }}>
                    {solution.detailedSolution}
                  </p>
                </div>
              )}
            </>
          )}

          <Button variant="primary" onClick={nextQuestion} className="w-full px-6 py-3 text-body">
            Next Question
          </Button>
        </>
      )}

      {/* Confirm button */}
      {(isAnswering || phase === "submitting") && (
        <Button
          variant="primary"
          onClick={submitAnswer}
          disabled={!selectedOption || phase === "submitting"}
          className="w-full px-6 py-3 text-body"
        >
          {phase === "submitting" ? "Confirming…" : "Confirm Answer"}
        </Button>
      )}
    </div>
  );
}
