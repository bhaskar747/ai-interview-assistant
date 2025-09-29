import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentCandidate: null,
  candidates: [],
  activeTab: 'interviewee',
  currentQuestionIndex: 0,
  interviewState: 'idle',
  questions: [],
  answers: [],
  individualScores: [],
  finalScore: 0,
  finalSummary: '',
  timer: 0,
  isTimerRunning: false,
  isProcessing: false
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload;
    },
    addCandidate: (state, action) => {
      const exists = state.candidates.find(c => c.id === action.payload.id);
      if (!exists) {
        state.candidates.push(action.payload);
      }
    },
    updateCandidate: (state, action) => {
      const index = state.candidates.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.candidates[index] = { ...state.candidates[index], ...action.payload };
      }
    },
    setInterviewState: (state, action) => {
      state.interviewState = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    startNewInterview: (state) => {
      state.currentQuestionIndex = 0;
      state.questions = [];
      state.answers = [];
      state.individualScores = [];
      state.timer = 0;
      state.isTimerRunning = false;
      state.isProcessing = false;
      state.interviewState = 'in-progress';
    },
    addQuestionAndAnswer: (state, action) => {
      const { question, answer, score } = action.payload;
      state.questions.push(question);
      state.answers.push(answer);
      state.individualScores.push(score);
      state.currentQuestionIndex += 1;
    },
    setTimer: (state, action) => {
      state.timer = action.payload;
    },
    setTimerRunning: (state, action) => {
      state.isTimerRunning = action.payload;
    },
    setProcessing: (state, action) => {
      state.isProcessing = action.payload;
    },
    completeInterview: (state, action) => {
      state.interviewState = 'completed';
      state.finalScore = action.payload.score;
      state.finalSummary = action.payload.summary;
    },
    resetInterview: (state) => {
      state.currentCandidate = null;
      state.currentQuestionIndex = 0;
      state.interviewState = 'idle';
      state.questions = [];
      state.answers = [];
      state.individualScores = [];
      state.finalScore = 0;
      state.finalSummary = '';
      state.timer = 0;
      state.isTimerRunning = false;
      state.isProcessing = false;
    }
  }
});

export const {
  setCurrentCandidate,
  addCandidate,
  updateCandidate,
  setInterviewState,
  setActiveTab,
  startNewInterview,
  addQuestionAndAnswer,
  setTimer,
  setTimerRunning,
  setProcessing,
  completeInterview,
  resetInterview
} = interviewSlice.actions;

export default interviewSlice.reducer;
