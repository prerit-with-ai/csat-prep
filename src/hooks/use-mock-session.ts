"use client";
import { useReducer, useRef, useCallback } from 'react';

export type MockQuestion = {
  id: string;
  topicId: string;
  difficulty: string;
  questionText: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

export type LocalResponse = {
  responseId: string;
  questionId: string;
  abcTag: 'A' | 'B' | 'C' | null;
  selectedOption: string | null;
};

type MockPhase = 'loading' | 'error' | 'first_pass' | 'review_b_prompt' | 'review_b' | 'submitting' | 'submitted';

type MockState = {
  phase: MockPhase;
  mockId: string | null;
  questions: MockQuestion[];
  responses: LocalResponse[];
  currentIndex: number;     // index in questions array
  bQueue: number[];         // indices of B-tagged questions (for review pass)
  bQueueIndex: number;      // current index in bQueue
  durationSeconds: number;
  errorMessage: string;
  saveError: boolean;
};

type MockAction =
  | { type: 'LOAD_SUCCESS'; mockId: string; questions: MockQuestion[]; responses: LocalResponse[]; durationSeconds: number }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'SET_TAG'; tag: 'A' | 'B' | 'C' }
  | { type: 'SET_OPTION'; option: string }
  | { type: 'ADVANCE_FIRST_PASS' }
  | { type: 'START_REVIEW_B' }
  | { type: 'ADVANCE_REVIEW_B' }
  | { type: 'SKIP_REVIEW' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMITTED' }
  | { type: 'MARK_SAVE_ERROR' };

const initialState: MockState = {
  phase: 'loading',
  mockId: null,
  questions: [],
  responses: [],
  currentIndex: 0,
  bQueue: [],
  bQueueIndex: 0,
  durationSeconds: 900,
  errorMessage: '',
  saveError: false,
};

function mockReducer(state: MockState, action: MockAction): MockState {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return {
        ...initialState,
        phase: 'first_pass',
        mockId: action.mockId,
        questions: action.questions,
        responses: action.responses,
        durationSeconds: action.durationSeconds,
      };

    case 'LOAD_ERROR':
      return { ...state, phase: 'error', errorMessage: action.message };

    case 'SET_TAG': {
      const updated = state.responses.map((r, i) =>
        i === state.currentIndex
          ? { ...r, abcTag: action.tag, selectedOption: action.tag !== 'A' ? null : r.selectedOption }
          : r
      );
      return { ...state, responses: updated };
    }

    case 'SET_OPTION': {
      // Only allowed when current question is A-tagged
      if (state.responses[state.currentIndex]?.abcTag !== 'A') return state;
      const updated = state.responses.map((r, i) =>
        i === state.currentIndex ? { ...r, selectedOption: action.option } : r
      );
      return { ...state, responses: updated };
    }

    case 'ADVANCE_FIRST_PASS': {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        // All questions visited — go to review prompt
        const bQueue = state.responses
          .map((r, i) => (r.abcTag === 'B' ? i : -1))
          .filter(i => i !== -1);
        return { ...state, phase: 'review_b_prompt', bQueue, currentIndex: nextIndex };
      }
      return { ...state, currentIndex: nextIndex };
    }

    case 'START_REVIEW_B':
      return { ...state, phase: 'review_b', bQueueIndex: 0, currentIndex: state.bQueue[0] ?? 0 };

    case 'ADVANCE_REVIEW_B': {
      const nextBIndex = state.bQueueIndex + 1;
      if (nextBIndex >= state.bQueue.length) {
        return { ...state, phase: 'submitting' };
      }
      return {
        ...state,
        bQueueIndex: nextBIndex,
        currentIndex: state.bQueue[nextBIndex],
      };
    }

    case 'SKIP_REVIEW':
      return { ...state, phase: 'submitting' };

    case 'SUBMIT_START':
      return { ...state, phase: 'submitting' };

    case 'SUBMITTED':
      return { ...state, phase: 'submitted' };

    case 'MARK_SAVE_ERROR':
      return { ...state, saveError: true };

    default:
      return state;
  }
}

export function useMockSession() {
  const [state, dispatch] = useReducer(mockReducer, initialState);
  const questionStartTimeRef = useRef(Date.now());

  const getElapsedForCurrentQuestion = () =>
    Math.round((Date.now() - questionStartTimeRef.current) / 1000);

  const resetQuestionTimer = useCallback(() => {
    questionStartTimeRef.current = Date.now();
  }, []);

  const setTag = (tag: 'A' | 'B' | 'C') => {
    dispatch({ type: 'SET_TAG', tag });
  };

  const setOption = (option: string) => {
    dispatch({ type: 'SET_OPTION', option });
  };

  const advanceFirstPass = async () => {
    if (!state.mockId) return;
    const current = state.responses[state.currentIndex];
    if (!current || !current.abcTag) return;

    const timeSpentSeconds = getElapsedForCurrentQuestion();
    resetQuestionTimer();

    // Fire-and-forget API call — dispatch MARK_SAVE_ERROR on failure
    fetch(`/api/mock/${state.mockId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: current.questionId,
        abcTag: current.abcTag,
        selectedOption: current.selectedOption,
        timeSpentSeconds,
      }),
    }).catch(() => dispatch({ type: 'MARK_SAVE_ERROR' }));

    dispatch({ type: 'ADVANCE_FIRST_PASS' });
  };

  const startReviewB = () => {
    resetQuestionTimer();
    dispatch({ type: 'START_REVIEW_B' });
  };

  const advanceReviewB = async () => {
    if (!state.mockId) return;
    const current = state.responses[state.currentIndex];
    if (!current) return;

    const timeSpentSeconds = getElapsedForCurrentQuestion();
    resetQuestionTimer();

    // Update response if tag/option changed during review
    fetch(`/api/mock/${state.mockId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: current.questionId,
        abcTag: current.abcTag ?? 'B',
        selectedOption: current.selectedOption,
        timeSpentSeconds,
        reviewedInSecondPass: true,
      }),
    }).catch(() => dispatch({ type: 'MARK_SAVE_ERROR' }));

    dispatch({ type: 'ADVANCE_REVIEW_B' });
  };

  const skipReview = () => {
    dispatch({ type: 'SKIP_REVIEW' });
  };

  const submitMock = async (): Promise<{ netScore: number; correctCount: number; wrongCount: number; skippedCount: number } | null> => {
    if (!state.mockId) return null;
    try {
      const res = await fetch(`/api/mock/${state.mockId}/submit`, { method: 'POST' });
      if (!res.ok) return null;
      const data = await res.json();
      dispatch({ type: 'SUBMITTED' });
      return data;
    } catch {
      return null;
    }
  };

  return {
    state,
    dispatch,
    setTag,
    setOption,
    advanceFirstPass,
    startReviewB,
    advanceReviewB,
    skipReview,
    submitMock,
    resetQuestionTimer,
  };
}
