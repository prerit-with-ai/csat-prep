"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePracticeSession, type PracticeQuestion } from "@/hooks/use-practice-session";
import { usePracticeKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardHint } from "@/components/KeyboardHint";
import { openFormulaCard } from "@/components/FormulaFab";

type Topic = {
  id: string;
  name: string;
  slug: string;
  section: string;
  status: string;
};

export default function PracticePage() {
  const { slug } = useParams() as { slug: string };
  const [topic, setTopic] = useState<Topic | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showDetailedSolution, setShowDetailedSolution] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { state, dispatch, selectOption, submitAnswer, nextQuestion, restart } = usePracticeSession();

  // Keyboard shortcuts
  usePracticeKeyboardShortcuts({
    phase: state.phase,
    selectedOption: state.selectedOption,
    onSelectOption: (key) => { if (state.phase === 'answering') selectOption(key); },
    onConfirm: () => { if (topic && state.phase === 'answering' && state.selectedOption) submitAnswer(topic.id); },
    onNext: () => { if (state.phase === 'solution') nextQuestion(); },
  });

  // Fetch topic and load questions
  useEffect(() => {
    const loadPracticeSession = async () => {
      try {
        // Fetch topic first
        const topicResponse = await fetch(`/api/topics/${slug}`);
        if (!topicResponse.ok) {
          throw new Error('Failed to load topic');
        }
        const topicData = await topicResponse.json();
        setTopic(topicData.topic);

        // Load practice questions
        const practiceResponse = await fetch('/api/practice/serve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topicId: topicData.topic.id }),
        });

        if (!practiceResponse.ok) {
          throw new Error('Failed to load practice questions');
        }

        const practiceData = await practiceResponse.json();
        dispatch({
          type: 'LOAD_SUCCESS',
          questions: practiceData.questions,
          level: practiceData.level,
        });
      } catch (error) {
        dispatch({
          type: 'LOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load practice session',
        });
      }
    };

    loadPracticeSession();
  }, [slug, dispatch]);

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
    if (!topic) return;
    submitAnswer(topic.id);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handlePracticeMore = async () => {
    if (!topic) return;

    restart();

    try {
      const practiceResponse = await fetch('/api/practice/serve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: topic.id }),
      });

      if (!practiceResponse.ok) {
        throw new Error('Failed to load practice questions');
      }

      const practiceData = await practiceResponse.json();
      dispatch({
        type: 'LOAD_SUCCESS',
        questions: practiceData.questions,
        level: practiceData.level,
      });
    } catch (error) {
      dispatch({
        type: 'LOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to load practice session',
      });
    }
  };

  if (state.phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Loading questions...
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
    const totalCount = state.answers.length;
    const levelAdvanced = state.levelAdvancedAt !== null;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-page-title mb-2" style={{ color: 'var(--text-primary)' }}>
            Practice Complete
          </h1>
          <p className="text-section-header" style={{ color: 'var(--text-secondary)' }}>
            {correctCount} / {totalCount}
          </p>
          <p className="text-body" style={{ color: 'var(--text-tertiary)' }}>
            {correctCount} correct out of {totalCount} questions
          </p>
        </div>

        {levelAdvanced && (
          <div
            className="mb-6 p-4 rounded-xl"
            style={{
              backgroundColor: 'var(--color-correct-bg)',
              color: 'var(--color-correct)',
            }}
          >
            <p className="text-body font-semibold">
              Level up! You&apos;ve advanced to {state.level.toUpperCase()}
            </p>
          </div>
        )}

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

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePracticeMore}
            className="flex-1 px-6 py-3 rounded-lg text-body"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            Practice more
          </button>
          <Link
            href={`/topics/${slug}`}
            className="flex-1 px-6 py-3 rounded-lg text-body text-center"
            style={{
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            Back to topic
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentIndex];
  const isAnswering = state.phase === 'answering';
  const isSubmitting = state.phase === 'submitting';
  const isSolution = state.phase === 'solution';

  const difficultyColors = {
    l1: 'var(--level-l1)',
    l2: 'var(--level-l2)',
    l3: 'var(--level-l3)',
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
        backgroundColor: 'var(--color-correct-bg)',
        color: 'var(--color-correct)',
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Question {state.currentIndex + 1} of {state.questions.length}
          </p>
          <span
            className="inline-block px-2 py-1 rounded text-xs font-semibold"
            style={{
              backgroundColor: difficultyColors[currentQuestion.difficulty.toLowerCase() as keyof typeof difficultyColors] || 'var(--bg-tertiary)',
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
              backgroundColor: state.currentSolution.isCorrect ? 'var(--color-correct-bg)' : 'var(--color-wrong-bg)',
              color: state.currentSolution.isCorrect ? 'var(--color-correct)' : 'var(--color-wrong)',
            }}
          >
            <p className="text-body font-semibold">
              {state.currentSolution.isCorrect ? '✓ Correct' : '✗ Incorrect'}
            </p>
          </div>

          {/* Level advanced callout */}
          {state.currentSolution.levelAdvanced && (
            <div
              className="mb-6 p-4 rounded-xl"
              style={{
                border: '2px solid var(--color-correct)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <p className="text-body font-semibold" style={{ color: 'var(--color-correct)' }}>
                Level up! You've advanced to {state.currentSolution.newLevel.toUpperCase()}
              </p>
            </div>
          )}

          {/* Smart solution */}
          <div className="mb-3 p-5 rounded-xl" style={{ border: '1px solid var(--border-default)' }}>
            <h3 className="text-section-header mb-3" style={{ color: 'var(--text-primary)' }}>
              Solution
            </h3>
            <p className="text-body" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
              {state.currentSolution.smartSolution}
            </p>
          </div>

          {/* Formula card deep-link */}
          {topic && (
            <div className="mb-6 flex">
              <button
                onClick={() => openFormulaCard(topic.id)}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <span>∑</span>
                <span>{topic.name} formula cards</span>
                <span style={{ color: 'var(--text-tertiary)' }}>→</span>
              </button>
            </div>
          )}

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
            {state.currentIndex + 1 >= state.questions.length ? 'See Summary' : 'Next Question'}
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

      <KeyboardHint mode="practice" />
    </div>
  );
}
