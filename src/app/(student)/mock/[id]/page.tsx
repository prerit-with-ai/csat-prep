"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useMockSession, type LocalResponse } from "@/hooks/use-mock-session";

export default function MockTestPage() {
  const { id: mockId } = useParams() as { id: string };
  const router = useRouter();
  const { state, dispatch, setTag, setOption, advanceFirstPass, startReviewB, advanceReviewB, skipReview, submitMock, resetQuestionTimer } = useMockSession();

  const [secondsLeft, setSecondsLeft] = useState(0);
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
    l1: '#10b981',
    l2: '#f59e0b',
    l3: '#ef4444',
  };

  if (state.phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Loading mock test...
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
          <button
            onClick={startReviewB}
            className="px-6 py-3 rounded-lg text-body"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            Review B Questions ({state.bQueue.length})
          </button>
          <button
            onClick={handleSkipAndSubmit}
            className="px-6 py-3 rounded-lg text-body"
            style={{
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            Skip & Submit
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-section-header" style={{ color: 'var(--text-primary)' }}>
            Mock Test
          </h1>
          {state.phase === 'first_pass' && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Question {state.currentIndex + 1} of {state.questions.length}
            </p>
          )}
          {state.phase === 'review_b' && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Review B: {state.bQueueIndex + 1} of {state.bQueue.length}
            </p>
          )}
        </div>
        {/* Timer */}
        <div className="text-body" style={{ color: getTimerColor() }}>
          ⏱ {formatTime(secondsLeft)}
        </div>
      </div>

      {/* Question navigator */}
      <div className="flex flex-wrap gap-1 mb-6">
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
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: isCurrent ? '2px solid var(--text-primary)' : `2px solid ${tagColor}`,
                backgroundColor: resp?.abcTag ? tagColor : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: resp?.abcTag ? '#fff' : 'var(--text-secondary)',
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
            backgroundColor: difficultyColors[currentQuestion.difficulty.toLowerCase() as keyof typeof difficultyColors] || '#6b7280',
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
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
          Tag this question:
        </p>
        <div className="flex gap-3">
          {(['A', 'B', 'C'] as const).map((tag) => {
            const isSelected = currentResponse?.abcTag === tag;
            const borderColor = tag === 'A' ? 'var(--color-correct)'
                              : tag === 'B' ? 'var(--color-amber)'
                              : 'var(--color-wrong)';
            return (
              <button
                key={tag}
                onClick={() => setTag(tag)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: '2px solid',
                  borderColor: isSelected ? borderColor : 'var(--border-default)',
                  backgroundColor: isSelected ? borderColor : 'transparent',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {tag === 'A' ? 'A — Ab Karo' : tag === 'B' ? 'B — Baad mein' : 'C — Chorh Do'}
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
        <button
          onClick={handleNext}
          disabled={!currentResponse?.abcTag}
          className="w-full px-6 py-3 rounded-lg text-body disabled:opacity-50"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          {state.currentIndex + 1 >= state.questions.length ? 'Finish First Pass' : 'Next Question →'}
        </button>
      )}
      {state.phase === 'review_b' && (
        <button
          onClick={handleNextReview}
          className="w-full px-6 py-3 rounded-lg text-body"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          {state.bQueueIndex + 1 >= state.bQueue.length ? 'Submit Mock' : 'Next Review →'}
        </button>
      )}
    </div>
  );
}
