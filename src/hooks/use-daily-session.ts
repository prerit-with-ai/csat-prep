import { useReducer } from 'react';

export type DailyQuestion = {
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
  doseCompleted: boolean;
};

export type AnswerRecord = {
  questionId: string;
  selectedOption: string | null;
  isCorrect: boolean;
  timeSpent: number;
  solution: QuestionSolution;
};

type DailySessionState = {
  phase: 'loading' | 'error' | 'answering' | 'submitting' | 'solution' | 'summary';
  doseId: string | null;
  questions: DailyQuestion[];
  currentIndex: number;
  selectedOption: string | null;
  currentSolution: QuestionSolution | null;
  answers: AnswerRecord[];
  answeredQuestionIds: string[];
  questionStartTime: number;
  errorMessage: string;
  doseCompleted: boolean;
};

type DailyAction =
  | { type: 'LOAD_SUCCESS'; doseId: string; questions: DailyQuestion[]; answeredQuestionIds: string[] }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'SELECT_OPTION'; option: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SOLUTION_RECEIVED'; solution: QuestionSolution; selectedOption: string | null; timeSpent: number; doseCompleted: boolean }
  | { type: 'NEXT_QUESTION' };

const initialState: DailySessionState = {
  phase: 'loading',
  doseId: null,
  questions: [],
  currentIndex: 0,
  selectedOption: null,
  currentSolution: null,
  answers: [],
  answeredQuestionIds: [],
  questionStartTime: Date.now(),
  errorMessage: '',
  doseCompleted: false,
};

function dailyReducer(state: DailySessionState, action: DailyAction): DailySessionState {
  switch (action.type) {
    case 'LOAD_SUCCESS': {
      // Find first unanswered question index
      const answeredSet = new Set(action.answeredQuestionIds);
      const firstUnanswered = action.questions.findIndex(q => !answeredSet.has(q.id));
      // If all answered (resume on completed dose), go to summary
      const phase = firstUnanswered === -1 ? 'summary' : 'answering';
      const startIndex = firstUnanswered === -1 ? 0 : firstUnanswered;
      return {
        ...state,
        phase,
        doseId: action.doseId,
        questions: action.questions,
        currentIndex: startIndex,
        answeredQuestionIds: action.answeredQuestionIds,
        selectedOption: null,
        currentSolution: null,
        answers: [],
        questionStartTime: Date.now(),
        errorMessage: '',
        doseCompleted: false,
      };
    }

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
        doseCompleted: action.doseCompleted,
      };
    }

    case 'NEXT_QUESTION': {
      const answeredSet = new Set(state.answeredQuestionIds);
      let nextIndex = state.currentIndex + 1;
      // Skip already-answered questions
      while (nextIndex < state.questions.length && answeredSet.has(state.questions[nextIndex].id)) {
        nextIndex++;
      }
      if (nextIndex >= state.questions.length || state.doseCompleted) {
        return { ...state, phase: 'summary' };
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

    default:
      return state;
  }
}

export function useDailySession() {
  const [state, dispatch] = useReducer(dailyReducer, initialState);

  const selectOption = (option: string) => {
    dispatch({ type: 'SELECT_OPTION', option });
  };

  const submitAnswer = async () => {
    if (state.phase !== 'answering' || !state.doseId) return;

    dispatch({ type: 'SUBMIT_START' });

    const timeSpent = Math.round((Date.now() - state.questionStartTime) / 1000);
    const questionId = state.questions[state.currentIndex].id;

    try {
      const response = await fetch('/api/daily/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doseId: state.doseId,
          questionId,
          selectedOption: state.selectedOption,
          timeSpent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit answer');
      }

      const data = await response.json();
      dispatch({
        type: 'SOLUTION_RECEIVED',
        solution: data,
        selectedOption: state.selectedOption,
        timeSpent,
        doseCompleted: data.doseCompleted,
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

  return {
    state,
    dispatch,
    selectOption,
    submitAnswer,
    nextQuestion,
  };
}
