'use client';

import { useReducer, useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";

// ==================== Types ====================

type Phase = 'loading' | 'list' | 'practicing' | 'solution' | 'error';

type RevisionItem = {
  id: string;
  patternTypeName: string;
  topicName: string;
  topicSection: string;
  status: string;
  reviewCount: number;
  wrongCount: number;
  nextReviewAt: string | null;
  question: {
    id: string;
    questionText: string;
    imageUrl: string | null;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
  };
};

type SolutionData = {
  isCorrect: boolean;
  correctOption: string;
  smartSolution: string;
  detailedSolution: string | null;
  optionAExplanation: string | null;
  optionBExplanation: string | null;
  optionCExplanation: string | null;
  optionDExplanation: string | null;
  resolved: boolean;
};

type State = {
  phase: Phase;
  items: RevisionItem[];
  currentItem: RevisionItem | null;
  selectedOption: string | null;
  solution: SolutionData | null;
  errorMessage: string;
};

type Action =
  | { type: 'LOAD_SUCCESS'; items: RevisionItem[] }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'START_PRACTICE'; item: RevisionItem }
  | { type: 'CANCEL_PRACTICE' }
  | { type: 'SELECT_OPTION'; option: string }
  | { type: 'SUBMIT_SUCCESS'; solution: SolutionData }
  | { type: 'DONE_REVIEWING' };

// ==================== Reducer ====================

const initialState: State = {
  phase: 'loading',
  items: [],
  currentItem: null,
  selectedOption: null,
  solution: null,
  errorMessage: '',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return {
        ...state,
        phase: action.items.length === 0 ? 'list' : 'list',
        items: action.items,
      };
    case 'LOAD_ERROR':
      return {
        ...state,
        phase: 'error',
        errorMessage: action.message,
      };
    case 'START_PRACTICE':
      return {
        ...state,
        phase: 'practicing',
        currentItem: action.item,
        selectedOption: null,
        solution: null,
      };
    case 'CANCEL_PRACTICE':
      return {
        ...state,
        phase: 'list',
        currentItem: null,
        selectedOption: null,
        solution: null,
      };
    case 'SELECT_OPTION':
      return {
        ...state,
        selectedOption: action.option,
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        phase: 'solution',
        solution: action.solution,
      };
    case 'DONE_REVIEWING':
      return {
        ...state,
        phase: 'list',
        items: state.items.filter((item) => item.id !== state.currentItem?.id),
        currentItem: null,
        selectedOption: null,
        solution: null,
      };
    default:
      return state;
  }
}

// ==================== Component ====================

export default function RevisionPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [timeSpent, setTimeSpent] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load revision items on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/revision', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load revision items');
        return r.json();
      })
      .then((data) => dispatch({ type: 'LOAD_SUCCESS', items: data.items }))
      .catch((e) => {
        if (e.name !== 'AbortError') {
          dispatch({ type: 'LOAD_ERROR', message: e.message });
        }
      });
    return () => controller.abort();
  }, []);

  // Timer effect for practicing phase
  useEffect(() => {
    if (state.phase === 'practicing') {
      startTimeRef.current = Date.now();
      setTimeSpent(0);
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.phase]);

  // Handle submit answer
  const handleSubmit = async () => {
    if (!state.currentItem || !state.selectedOption) return;

    try {
      const response = await fetch(`/api/revision/${state.currentItem.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: state.currentItem.question.id,
          selectedOption: state.selectedOption,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      const solution: SolutionData = await response.json();
      dispatch({ type: 'SUBMIT_SUCCESS', solution });
    } catch (error) {
      dispatch({ type: 'LOAD_ERROR', message: 'Failed to submit answer' });
    }
  };

  // Render helpers
  const getSectionBadgeStyle = (section: string) => {
    switch (section.toLowerCase()) {
      case 'math':
        return { backgroundColor: 'var(--section-math-bg)', color: 'var(--section-math)', border: '1px solid var(--section-math)' };
      case 'lr':
        return { backgroundColor: 'var(--section-lr-bg)', color: 'var(--section-lr)', border: '1px solid var(--section-lr)' };
      case 'rc':
        return { backgroundColor: 'var(--section-rc-bg)', color: 'var(--section-rc)', border: '1px solid var(--section-rc)' };
      default:
        return { color: 'var(--text-secondary)', border: '1px solid var(--border-default)' };
    }
  };

  const getOptionStyle = (option: string) => {
    const baseStyle = {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid var(--border-default)',
      borderRadius: '8px',
      textAlign: 'left' as const,
      fontSize: '15px',
      lineHeight: '1.7',
      cursor: 'pointer',
      transition: 'all 100ms ease-out',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    };

    if (state.phase === 'solution' && state.solution) {
      if (option.toLowerCase() === state.solution.correctOption.toLowerCase()) {
        return {
          ...baseStyle,
          backgroundColor: 'var(--color-correct)',
          color: 'white',
          borderColor: 'var(--color-correct)',
        };
      }
      if (option.toLowerCase() === state.selectedOption?.toLowerCase() && !state.solution.isCorrect) {
        return {
          ...baseStyle,
          backgroundColor: 'var(--color-wrong)',
          color: 'white',
          borderColor: 'var(--color-wrong)',
        };
      }
      return { ...baseStyle, opacity: 0.6 };
    }

    if (state.selectedOption === option) {
      return {
        ...baseStyle,
        borderColor: 'var(--text-primary)',
        backgroundColor: 'var(--bg-secondary)',
      };
    }

    return baseStyle;
  };

  // ==================== Render Phases ====================

  if (state.phase === 'loading') {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
          Revision Queue
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
          Revision Queue
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--color-wrong)' }}>{state.errorMessage}</p>
      </div>
    );
  }

  if (state.phase === 'list') {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
          Revision Queue
        </h1>

        {state.items.length === 0 ? (
          <div
            style={{
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              padding: '40px 16px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              No revision due today. Check back tomorrow.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {state.items.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '20px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {item.patternTypeName}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.topicName}</span>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          ...getSectionBadgeStyle(item.topicSection),
                        }}
                      >
                        {item.topicSection.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {item.status === 'persistent' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-wrong)' }} />
                      <span style={{ fontSize: '12px', color: 'var(--color-wrong)' }}>Persistent weakness</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    Review {item.reviewCount + 1} of 3
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => dispatch({ type: 'START_PRACTICE', item })}
                  >
                    Practice Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (state.phase === 'practicing' && state.currentItem) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => dispatch({ type: 'CANCEL_PRACTICE' })}
          className="mb-6"
        >
          ← Back to List
        </Button>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {state.currentItem.patternTypeName}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{state.currentItem.topicName}</span>
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '4px',
              ...getSectionBadgeStyle(state.currentItem.topicSection),
            }}
          >
            {state.currentItem.topicSection.toUpperCase()}
          </span>
        </div>

        <div
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '20px 16px',
            marginBottom: '24px',
          }}
        >
          <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-primary)', marginBottom: '16px' }}>
            {state.currentItem.question.questionText}
          </p>

          {state.currentItem.question.imageUrl && (
            <img
              src={state.currentItem.question.imageUrl}
              alt="Question illustration"
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', marginBottom: '16px' }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => dispatch({ type: 'SELECT_OPTION', option: 'A' })}
              disabled={state.selectedOption !== null}
              style={getOptionStyle('A')}
            >
              <strong>A.</strong> {state.currentItem.question.optionA}
            </button>
            <button
              onClick={() => dispatch({ type: 'SELECT_OPTION', option: 'B' })}
              disabled={state.selectedOption !== null}
              style={getOptionStyle('B')}
            >
              <strong>B.</strong> {state.currentItem.question.optionB}
            </button>
            <button
              onClick={() => dispatch({ type: 'SELECT_OPTION', option: 'C' })}
              disabled={state.selectedOption !== null}
              style={getOptionStyle('C')}
            >
              <strong>C.</strong> {state.currentItem.question.optionC}
            </button>
            <button
              onClick={() => dispatch({ type: 'SELECT_OPTION', option: 'D' })}
              disabled={state.selectedOption !== null}
              style={getOptionStyle('D')}
            >
              <strong>D.</strong> {state.currentItem.question.optionD}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Time: {timeSpent}s</span>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!state.selectedOption}
            style={{ padding: '12px 24px', fontSize: '15px' }}
          >
            Submit Answer
          </Button>
        </div>
      </div>
    );
  }

  if (state.phase === 'solution' && state.currentItem && state.solution) {
    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {state.currentItem.patternTypeName}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{state.currentItem.topicName}</span>
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '4px',
              ...getSectionBadgeStyle(state.currentItem.topicSection),
            }}
          >
            {state.currentItem.topicSection.toUpperCase()}
          </span>
        </div>

        <div
          style={{
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '20px 16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: state.solution.isCorrect ? 'var(--color-correct)' : 'var(--color-wrong)',
              color: 'white',
              marginBottom: '16px',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            {state.solution.isCorrect ? 'Correct' : 'Incorrect'}
          </div>

          <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-primary)', marginBottom: '16px' }}>
            {state.currentItem.question.questionText}
          </p>

          {state.currentItem.question.imageUrl && (
            <img
              src={state.currentItem.question.imageUrl}
              alt="Question illustration"
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', marginBottom: '16px' }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={getOptionStyle('A')}>
              <strong>A.</strong> {state.currentItem.question.optionA}
            </div>
            <div style={getOptionStyle('B')}>
              <strong>B.</strong> {state.currentItem.question.optionB}
            </div>
            <div style={getOptionStyle('C')}>
              <strong>C.</strong> {state.currentItem.question.optionC}
            </div>
            <div style={getOptionStyle('D')}>
              <strong>D.</strong> {state.currentItem.question.optionD}
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border-default)',
              paddingTop: '16px',
            }}
          >
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Solution
            </h4>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-primary)', marginBottom: '16px' }}>
              {state.solution.smartSolution}
            </p>

            {state.solution.detailedSolution && (
              <details style={{ marginBottom: '16px' }}>
                <summary
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    marginBottom: '8px',
                  }}
                >
                  Detailed approach
                </summary>
                <p style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                  {state.solution.detailedSolution}
                </p>
              </details>
            )}

            {(state.solution.optionAExplanation ||
              state.solution.optionBExplanation ||
              state.solution.optionCExplanation ||
              state.solution.optionDExplanation) && (
              <div>
                <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Why other options are incorrect:
                </h5>
                {state.solution.optionAExplanation && state.solution.correctOption !== 'A' && (
                  <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <strong>A:</strong> {state.solution.optionAExplanation}
                  </p>
                )}
                {state.solution.optionBExplanation && state.solution.correctOption !== 'B' && (
                  <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <strong>B:</strong> {state.solution.optionBExplanation}
                  </p>
                )}
                {state.solution.optionCExplanation && state.solution.correctOption !== 'C' && (
                  <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <strong>C:</strong> {state.solution.optionCExplanation}
                  </p>
                )}
                {state.solution.optionDExplanation && state.solution.correctOption !== 'D' && (
                  <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <strong>D:</strong> {state.solution.optionDExplanation}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {state.solution.resolved && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            Pattern marked as resolved. It will no longer appear in your revision queue.
          </div>
        )}

        <Button
          variant="primary"
          onClick={() => dispatch({ type: 'DONE_REVIEWING' })}
          className="w-full"
          style={{ padding: '12px 24px', fontSize: '15px' }}
        >
          Done
        </Button>
      </div>
    );
  }

  return null;
}
