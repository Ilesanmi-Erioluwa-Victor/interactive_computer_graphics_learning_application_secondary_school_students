import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import lessonReducer from './lessonSlice.js';
import quizReducer from './quizSlice.js';
import progressReducer from './progressSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    lessons: lessonReducer,
    quiz: quizReducer,
    progress: progressReducer,
  },
});

export default store;
