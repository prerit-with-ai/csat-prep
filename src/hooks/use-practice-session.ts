import { useReducer } from 'react';

export type PracticeQuestion = {
  id: string;
  topicId: string;
  patternTypeId: string | null;
  passageId: string | null;
  difficulty: string;
  questionText: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

export type QuestionSolution = {
  isCorrect: boolean;
  correctOption: string;
  smartSolution: string;
  detailedSolution: string | null;
  optionAExplanation: string | null;
  optionBExplanation: string | null;
  optionCExplanation: string | null;
  optionDExplanation: string | null;
  levelAdvanced: boolean;
  newLevel: string;
  topicStatus: string;
};

export type AnswerRecord = {
  questionId: string;
  selectedOption: string | null;
  isCorrect: boolean;
  timeSpent: number;
  solution: QuestionSolution;
};

type PracticeState = {
  phase: 'loading' | 'error' | 'answering' | 'submitting' | 'solution' | 'summary';
  questions: PracticeQuestion[];
  currentIndex: number;
  selectedOption: string | null;
  currentSolution: QuestionSolution | null;
  answers: AnswerRecord[];
  level: string;
  levelAdvancedAt: number | null;
  questionStartTime: number;
  errorMessage: string;
};

type PracticeAction =
  | { type: 'LOAD_SUCCESS'; questions: PracticeQuestion[]; level: string }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'SELECT_OPTION'; option: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SOLUTION_RECEIVED'; solution: QuestionSolution; selectedOption: string | null; timeSpent: number }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RESTART' };

const initialState: PracticeState = {
  phase: 'loading',
  questions: [],
  currentIndex: 0,
  selectedOption: null,
  currentSolution: null,
  answers: [],
  level: 'l1',
  levelAdvancedAt: null,
  questionStartTime: Date.now(),
  errorMessage: '',
};

function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      if (action.questions.length === 0) {
        return {
          ...state,
          phase: 'error',
          errorMessage: 'No questions available at your current level for this topic.',
        };
      }
      return {
        ...state,
        phase: 'answering',
        questions: action.questions,
        level: action.level,
        currentIndex: 0,
        selectedOption: null,
        currentSolution: null,
        answers: [],
        levelAdvancedAt: null,
        questionStartTime: Date.now(),
        errorMessage: '',
      };

    case 'LOAD_ERROR':
      return {
        ...state,
        phase: 'error',
        errorMessage: action.message,
      };

    case 'SELECT_OPTION':
      return {
        ...state,
        selectedOption: action.option,
      };

    case 'SUBMIT_START':
      return {
        ...state,
        phase: 'submitting',
      };

    case 'SOLUTION_RECEIVED': {
      const newAnswers = [
        ...state.answers,
        {
          questionId: state.questions[state.currentIndex].id,
          selectedOption: action.selectedOption,
          isCorrect: action.solution.isCorrect,
          timeSpent: action.timeSpent,
          solution: action.solution,
        },
      ];

      return {
        ...state,
        phase: 'solution',
        currentSolution: action.solution,
        answers: newAnswers,
        level: action.solution.newLevel,
        levelAdvancedAt: action.solution.levelAdvanced ? state.currentIndex : state.levelAdvancedAt,
      };
    }

    case 'NEXT_QUESTION': {
      const nextIndex = state.currentIndex + 1;

      if (nextIndex >= state.questions.length) {
        return {
          ...state,
          phase: 'summary',
        };
      }

      return {
        ...state,
        phase: 'answering',
        currentIndex: nextIndex,
        selectedOption: null,
        currentSolution: null,
        questionStartTime: Date.now(),
      };
    }

    case 'RESTART':
      return {
        ...initialState,
        phase: 'loading',
        questionStartTime: Date.now(),
      };

    default:
      return state;
  }
}

export function usePracticeSession() {
  const [state, dispatch] = useReducer(practiceReducer, initialState);

  const selectOption = (option: string) => {
    dispatch({ type: 'SELECT_OPTION', option });
  };

  const submitAnswer = async (topicId: string) => {
    if (state.phase !== 'answering') return;
    if (!state.questions[state.currentIndex]) return;

    dispatch({ type: 'SUBMIT_START' });

    const timeSpent = Math.round((Date.now() - state.questionStartTime) / 1000);
    const questionId = state.questions[state.currentIndex].id;

    try {
      const response = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          topicId,
          selectedOption: state.selectedOption,
          timeSpent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to submit answer');
      }

      const data = await response.json();
      dispatch({
        type: 'SOLUTION_RECEIVED',
        solution: data,
        selectedOption: state.selectedOption,
        timeSpent,
      });
    } catch (error) {
      dispatch({
        type: 'LOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to submit answer',
      });
    }
  };

  const nextQuestion = () => {
    dispatch({ type: 'NEXT_QUESTION' });
  };

  const restart = () => {
    dispatch({ type: 'RESTART' });
  };

  return {
    state,
    dispatch,
    selectOption,
    submitAnswer,
    nextQuestion,
    restart,
  };
}
