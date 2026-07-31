import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentQuiz: null,
  currentAttempt: null,
  currentResult: null,
  isLoading: false,
  error: null,
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    quizStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    quizSuccess: (state, action) => {
      state.isLoading = false;
      state.currentQuiz = action.payload;
    },
    attemptStartSuccess: (state, action) => {
      state.isLoading = false;
      state.currentAttempt = action.payload;
    },
    submitSuccess: (state, action) => {
      state.isLoading = false;
      state.currentResult = action.payload;
    },
    quizFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    resetQuiz: (state) => {
      state.currentQuiz = null;
      state.currentAttempt = null;
      state.currentResult = null;
      state.error = null;
    },
  },
});

export const {
  quizStart,
  quizSuccess,
  attemptStartSuccess,
  submitSuccess,
  quizFailure,
  resetQuiz,
} = quizSlice.actions;
export default quizSlice.reducer;
