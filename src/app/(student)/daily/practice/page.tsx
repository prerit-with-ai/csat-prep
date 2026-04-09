"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useDailySession, type DailyQuestion } from "@/hooks/use-daily-session";

export default function DailyPracticePage() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showDetailedSolution, setShowDetailedSolution] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { state, dispatch, selectOption, submitAnswer, nextQuestion } = useDailySession();

  // Fetch daily dose and load questions
  useEffect(() => {
    const loadDailyDose = async () => {
      try {
        const response = await fetch('/api/daily');
        if (!response.ok) {
          throw new Error('Failed to load daily dose');
        }

        const data = await response.json();
        dispatch({
          type: 'LOAD_SUCCESS',
          doseId: data.dose.id,
          questions: data.questions,
          answeredQuestionIds: data.answeredQuestionIds,
        });
      } catch (error) {
        dispatch({
          type: 'LOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load daily dose',
        });
      }
    };

    loadDailyDose();
  }, [dispatch]);

  // Timer logic
  useEffect(() => {
    if (state.phase === 'answering' || state.phase === 'submitting') {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.phase, state.currentIndex]);

  // Reset detailed solution toggle on new question
  useEffect(() => {
    setShowDetailedSolution(false);
  }, [state.currentIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmAnswer = () => {
    submitAnswer();
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (state.phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Loading today's dose...
        </p>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-body" style={{ color: 'var(--color-wrong)' }}>
          Error: {state.errorMessage}
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 rounded-lg text-body"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.phase === 'summary') {
    const correctCount = state.answers.filter((a) => a.isCorrect).length;
    const totalCount = state.questions.length;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-page-title mb-2" style={{ color: 'var(--text-primary)' }}>
            Daily Dose Complete
          </h1>
          <p className="text-section-header" style={{ color: 'var(--text-secondary)' }}>
            {correctCount} / {totalCount}
          </p>
          <p className="text-body" style={{ color: 'var(--text-tertiary)' }}>
            {correctCount} correct out of {totalCount} questions
          </p>
        </div>

        <div className="mb-8 p-5 rounded-xl" style={{ border: '1px solid var(--border-default)' }}>
          <h2 className="text-section-header mb-4" style={{ color: 'var(--text-primary)' }}>
            Question Summary
          </h2>
          <div className="space-y-3">
            {state.answers.map((answer, idx) => (
              <div
                key={answer.questionId}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: idx < state.answers.length - 1 ? '1px solid var(--border-default)' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-body" style={{ color: 'var(--text-secondary)' }}>
                    Q{idx + 1}
                  </span>
                  <span
                    className="text-body font-semibold"
                    style={{ color: answer.isCorrect ? 'var(--color-correct)' : 'var(--color-wrong)' }}
                  >
                    {answer.isCorrect ? '✓' : '✗'}
                  </span>
                </div>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {formatTime(answer.timeSpent)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/dashboard"
          className="block w-full px-6 py-3 rounded-lg text-body text-center"
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

  const currentQuestion = state.questions[state.currentIndex];
  const isAnswering = state.phase === 'answering';
  const isSubmitting = state.phase === 'submitting';
  const isSolution = state.phase === 'solution';

  const difficultyColors = {
    l1: '#10b981',
    l2: '#f59e0b',
    l3: '#ef4444',
  };

  const getDifficultyLabel = (difficulty: string) => {
    const lower = difficulty.toLowerCase();
    if (lower === 'l1') return 'Easy';
    if (lower === 'l2') return 'Medium';
    if (lower === 'l3') return 'Hard';
    return difficulty;
  };

  const options = [
    { key: 'A', text: currentQuestion.optionA },
    { key: 'B', text: currentQuestion.optionB },
    { key: 'C', text: currentQuestion.optionC },
    { key: 'D', text: currentQuestion.optionD },
  ];

  const correctOption = isSolution ? state.currentSolution?.correctOption?.toUpperCase() : null;
  const userAnswer = isSolution ? state.answers[state.answers.length - 1]?.selectedOption?.toUpperCase() : null;

  const getOptionStyle = (optionKey: string) => {
    if (!isSolution) {
      if (state.selectedOption === optionKey) {
        return {
          border: '2px solid var(--text-primary)',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
        };
      }
      return {
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      };
    }

    // Solution phase
    if (optionKey === correctOption) {
      return {
        border: '1px solid var(--color-correct)',
        backgroundColor: 'var(--status-correct)',
        color: 'var(--bg-primary)',
      };
    }

    if (optionKey === userAnswer && optionKey !== correctOption) {
      return {
        border: '2px solid var(--color-wrong)',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      };
    }

    return {
      border: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-secondary)',
    };
  };

  const getOptionExplanation = (optionKey: string) => {
    if (!state.currentSolution) return null;

    switch (optionKey) {
      case 'A': return state.currentSolution.optionAExplanation;
      case 'B': return state.currentSolution.optionBExplanation;
      case 'C': return state.currentSolution.optionCExplanation;
      case 'D': return state.currentSolution.optionDExplanation;
      default: return null;
    }
  };

  // Determine if next question should show "See Summary"
  const isLastUnanswered = () => {
    const answeredSet = new Set(state.answeredQuestionIds);
    let nextIndex = state.currentIndex + 1;
    // Skip already-answered questions
    while (nextIndex < state.questions.length && answeredSet.has(state.questions[nextIndex].id)) {
      nextIndex++;
    }
    return nextIndex >= state.questions.length || state.doseCompleted;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-section-header mb-1" style={{ color: 'var(--text-primary)' }}>
            Daily Dose
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Question {state.currentIndex + 1} of {state.questions.length}
          </p>
          <span
            className="inline-block px-2 py-1 rounded text-xs font-semibold mt-2"
            style={{
              backgroundColor: difficultyColors[currentQuestion.difficulty.toLowerCase() as keyof typeof difficultyColors] || '#6b7280',
              color: '#ffffff',
            }}
          >
            {getDifficultyLabel(currentQuestion.difficulty)}
          </span>
        </div>
        {(isAnswering || isSubmitting) && (
          <div className="flex items-center gap-2">
            <span className="text-body" style={{ color: 'var(--text-secondary)' }}>
              ⏱ {formatTime(elapsedSeconds)}
            </span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="mb-8 p-5 rounded-xl" style={{ border: '1px solid var(--border-default)' }}>
        <p className="text-body" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
          {currentQuestion.questionText}
        </p>
        {currentQuestion.imageUrl && (
          <img
            src={currentQuestion.imageUrl}
            alt="Question illustration"
            className="mt-4 max-w-full rounded-lg"
          />
        )}
      </div>

      {/* Options */}
      <div className="mb-6 space-y-3">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={() => isAnswering && selectOption(option.key)}
            disabled={!isAnswering}
            className="w-full p-4 rounded-lg text-left transition-all text-body"
            style={getOptionStyle(option.key)}
          >
            <span className="font-semibold">{option.key}.</span> {option.text}
          </button>
        ))}
      </div>

      {/* Solution Phase */}
      {isSolution && state.currentSolution && (
        <>
          {/* Result banner */}
          <div
            className="mb-6 p-4 rounded-xl text-center"
            style={{
              backgroundColor: state.currentSolution.isCorrect ? 'var(--status-correct)' : '#fee2e2',
              color: state.currentSolution.isCorrect ? 'var(--bg-primary)' : 'var(--color-wrong)',
            }}
          >
            <p className="text-body font-semibold">
              {state.currentSolution.isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </p>
          </div>

          {/* Smart solution */}
          <div className="mb-6 p-5 rounded-xl" style={{ border: '1px solid var(--border-default)' }}>
            <h3 className="text-section-header mb-3" style={{ color: 'var(--text-primary)' }}>
              Solution
            </h3>
            <p className="text-body" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
              {state.currentSolution.smartSolution}
            </p>
          </div>

          {/* Detailed solution toggle */}
          {state.currentSolution.detailedSolution && (
            <>
              <button
                onClick={() => setShowDetailedSolution(!showDetailedSolution)}
                className="mb-4 text-body underline"
                style={{ color: 'var(--text-primary)' }}
              >
                {showDetailedSolution ? 'Hide' : 'Show'} detailed solution
              </button>

              {showDetailedSolution && (
                <div className="mb-6 p-5 rounded-xl" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-secondary)' }}>
                  <p className="text-body" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
                    {state.currentSolution.detailedSolution}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Option explanations */}
          {options.some((opt) => getOptionExplanation(opt.key)) && (
            <div className="mb-6 p-5 rounded-xl" style={{ border: '1px solid var(--border-default)' }}>
              <h3 className="text-section-header mb-3" style={{ color: 'var(--text-primary)' }}>
                Option Explanations
              </h3>
              <div className="space-y-3">
                {options.map((option) => {
                  const explanation = getOptionExplanation(option.key);
                  if (!explanation) return null;
                  return (
                    <div key={option.key}>
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {option.key}. {option.text}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                        {explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next question button */}
          <button
            onClick={nextQuestion}
            className="w-full px-6 py-3 rounded-lg text-body"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            {isLastUnanswered() ? 'See Summary' : 'Next Question'}
          </button>
        </>
      )}

      {/* Confirm answer button */}
      {(isAnswering || isSubmitting) && (
        <button
          onClick={handleConfirmAnswer}
          disabled={!state.selectedOption || isSubmitting}
          className="w-full px-6 py-3 rounded-lg text-body disabled:opacity-50"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          {isSubmitting ? 'Confirming...' : 'Confirm Answer'}
        </button>
      )}
    </div>
  );
}
