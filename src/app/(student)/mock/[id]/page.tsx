"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useMockSession, type LocalResponse } from "@/hooks/use-mock-session";
import { useMockKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { KeyboardHint } from "@/components/KeyboardHint";
import { Button } from "@/components/ui/button";

export default function MockTestPage() {
  const { id: mockId } = useParams() as { id: string };
  const router = useRouter();
  const { state, dispatch, setTag, setOption, advanceFirstPass, startReviewB, advanceReviewB, skipReview, submitMock, resetQuestionTimer } = useMockSession();

  const [secondsLeft, setSecondsLeft] = useState(0);

  // Keyboard shortcuts for mock mode
  useMockKeyboardShortcuts({
    phase: state.phase,
    currentAbcTag: state.responses[state.currentIndex]?.abcTag ?? null,
    onSetTag: setTag,
    onSetOption: setOption,
    onAdvance: async () => {
      if (state.phase === 'first_pass') await advanceFirstPass();
      else if (state.phase === 'review_b') await advanceReviewB();
    },
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch mock test and load data
  useEffect(() => {
    const abortController = new AbortController();

    const loadMock = async () => {
      try {
        const response = await fetch(`/api/mock/${mockId}`, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error('Failed to load mock test');
        }

        const data = await response.json();

        // Sort questions by displayOrder
        const sortedQuestions = [...data.questions].sort((a, b) => a.displayOrder - b.displayOrder);

        // Map responses to LocalResponse format
        const localResponses: LocalResponse[] = sortedQuestions.map((q: any) => {
          const existingResponse = data.responses?.find((r: any) => r.questionId === q.id);
          return {
            responseId: existingResponse?.id || '',
            questionId: q.id,
            abcTag: existingResponse?.abcTag as 'A' | 'B' | 'C' | null || null,
            selectedOption: existingResponse?.selectedOption || null,
          };
        });

        dispatch({
          type: 'LOAD_SUCCESS',
          mockId: data.mock.id,
          questions: sortedQuestions,
          responses: localResponses,
          durationSeconds: data.mock.durationSeconds,
        });

        setSecondsLeft(data.mock.durationSeconds);
        resetQuestionTimer();
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        dispatch({
          type: 'LOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load mock test',
        });
      }
    };

    loadMock();

    return () => abortController.abort();
  }, [mockId, dispatch, resetQuestionTimer]);

  // Global countdown timer
  useEffect(() => {
    if (state.phase === 'first_pass' || state.phase === 'review_b') {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            // Auto-submit when time's up
            handleTimeExpired();
            return 0;
          }
          return next;
        });
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
  }, [state.phase]);

  // Redirect to analysis when submitted
  useEffect(() => {
    if (state.phase === 'submitted') {
      router.push(`/mock/${mockId}/analysis`);
    }
  }, [state.phase, mockId, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (secondsLeft <= 300) return 'var(--color-wrong)'; // 5 minutes
    if (secondsLeft <= 900) return 'var(--color-amber)'; // 15 minutes
    return 'var(--text-primary)';
  };

  const handleTimeExpired = async () => {
    await handleSkipAndSubmit();
  };

  const handleNext = async () => {
    await advanceFirstPass();
  };

  const handleNextReview = async () => {
    if (state.bQueueIndex + 1 >= state.bQueue.length) {
      await handleSubmit();
    } else {
      await advanceReviewB();
    }
  };

  const handleSkipAndSubmit = async () => {
    skipReview();
    await handleSubmit();
  };

  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT_START' });
    await submitMock();
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const getDifficultyLabel = (difficulty: string) => {
    const lower = difficulty.toLowerCase();
    if (lower === 'l1') return 'Easy';
    if (lower === 'l2') return 'Medium';
    if (lower === 'l3') return 'Hard';
    return difficulty;
  };

  const difficultyColors = {
    l1: 'var(--level-l1)',
    l2: 'var(--level-l2)',
    l3: 'var(--level-l3)',
  };

  if (state.phase === 'loading') {
    return (
      <div className="py-20 flex items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Loading mock test...
        </p>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <p className="text-body" style={{ color: 'var(--color-wrong)' }}>
          Error: {state.errorMessage}
        </p>
        <Button variant="primary" onClick={handleRetry} className="px-6 py-3 text-body">
          Retry
        </Button>
      </div>
    );
  }

  if (state.phase === 'review_b_prompt') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-page-title mb-4" style={{ color: 'var(--text-primary)' }}>
          First Pass Complete
        </h2>
        <p className="text-body mb-2" style={{ color: 'var(--text-secondary)' }}>
          You have tagged {state.bQueue.length} question(s) as B (to revisit).
        </p>
        <p className="text-body mb-8" style={{ color: 'var(--text-secondary)' }}>
          Would you like to review them now?
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={startReviewB} className="px-6 py-3 text-body">
            Review B Questions ({state.bQueue.length})
          </Button>
          <Button variant="secondary" onClick={handleSkipAndSubmit} className="px-6 py-3 text-body">
            Skip & Submit
          </Button>
        </div>
      </div>
    );
  }

  if (state.phase === 'submitting') {
    return (
      <div className="py-20 flex items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Submitting mock test...
        </p>
      </div>
    );
  }

  // Render question interface (first_pass and review_b)
  const currentQuestion = state.questions[state.currentIndex];
  const currentResponse = state.responses[state.currentIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Loading question...
        </p>
      </div>
    );
  }

  const options = [
    { key: 'A', text: currentQuestion.optionA },
    { key: 'B', text: currentQuestion.optionB },
    { key: 'C', text: currentQuestion.optionC },
    { key: 'D', text: currentQuestion.optionD },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Save error banner */}
      {state.saveError && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-amber-bg)',
            border: '1px solid var(--color-amber)',
            color: 'var(--color-amber)',
          }}
        >
          Connection issue — some responses may not have saved. Check your network and continue.
        </div>
      )}

      {/* Session bar — progress + timer */}
      <div
        className="flex items-center justify-between mb-5 px-4 py-3 rounded-xl"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {state.phase === 'review_b' ? 'Review B' : 'First pass'}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {state.phase === 'review_b'
              ? `${state.bQueueIndex + 1} / ${state.bQueue.length}`
              : `${state.currentIndex + 1} / ${state.questions.length}`}
          </span>
        </div>
        <div
          className="text-sm font-semibold tabular-nums"
          style={{ color: getTimerColor() }}
        >
          ⏱ {formatTime(secondsLeft)}
        </div>
      </div>

      {/* Question navigator — horizontal scroll on mobile */}
      <div
        className="flex gap-1 mb-5 pb-1"
        style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
      >
        {state.questions.map((q, i) => {
          const resp = state.responses[i];
          const tagColor = resp?.abcTag === 'A' ? 'var(--color-correct)'
                         : resp?.abcTag === 'B' ? 'var(--color-amber)'
                         : resp?.abcTag === 'C' ? 'var(--color-wrong)'
                         : 'var(--border-default)';
          const isCurrent = i === state.currentIndex;
          return (
            <div
              key={q.id}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: isCurrent ? '2px solid var(--text-primary)' : `2px solid ${tagColor}`,
                backgroundColor: resp?.abcTag ? tagColor : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 600,
                color: resp?.abcTag ? '#fff' : 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* Difficulty badge */}
      <div className="mb-4">
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

      {/* Question text card */}
      <div className="mb-6 p-5 rounded-xl" style={{ border: '1px solid var(--border-default)' }}>
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

      {/* ABC Tag buttons */}
      <div className="mb-4">
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>
          Tag this question
        </p>
        <div className="flex gap-2">
          {([
            { tag: 'A', label: 'Ab Karo', color: 'var(--color-correct)' },
            { tag: 'B', label: 'Baad mein', color: 'var(--color-amber)' },
            { tag: 'C', label: 'Chorh Do', color: 'var(--color-wrong)' },
          ] as const).map(({ tag, label, color }) => {
            const isSelected = currentResponse?.abcTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setTag(tag)}
                className="flex-1 flex flex-col items-center py-2.5 px-1 rounded-lg transition-colors"
                style={{
                  border: `2px solid ${isSelected ? color : 'var(--border-default)'}`,
                  backgroundColor: isSelected ? color : 'transparent',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{tag}</span>
                <span style={{ fontSize: 10, marginTop: 2, opacity: isSelected ? 0.85 : 0.7 }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer options */}
      <div className="mb-6 space-y-3">
        {options.map((opt) => {
          const isSelected = currentResponse?.selectedOption === opt.key;
          const canAnswer = currentResponse?.abcTag === 'A';
          return (
            <button
              key={opt.key}
              onClick={() => canAnswer && setOption(opt.key)}
              disabled={!canAnswer}
              className="w-full p-4 rounded-lg text-left text-body"
              style={{
                border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
                backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                color: canAnswer ? 'var(--text-primary)' : 'var(--text-tertiary)',
                opacity: canAnswer ? 1 : 0.5,
                fontSize: 15,
              }}
            >
              <span style={{ fontWeight: 600 }}>{opt.key}.</span> {opt.text}
            </button>
          );
        })}
      </div>

      {/* Next / Submit button */}
      {state.phase === 'first_pass' && (
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!currentResponse?.abcTag}
          className="w-full px-6 py-3 text-body"
        >
          {state.currentIndex + 1 >= state.questions.length ? 'Finish First Pass' : 'Next Question →'}
        </Button>
      )}
      {state.phase === 'review_b' && (
        <Button variant="primary" onClick={handleNextReview} className="w-full px-6 py-3 text-body">
          {state.bQueueIndex + 1 >= state.bQueue.length ? 'Submit Mock' : 'Next Review →'}
        </Button>
      )}

      <KeyboardHint mode="mock" />
    </div>
  );
}
