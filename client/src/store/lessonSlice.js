import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  modules: [],
  currentModule: null,
  currentLesson: null,
  isLoading: false,
  error: null,
};

const lessonSlice = createSlice({
  name: 'lessons',
  initialState,
  reducers: {
    lessonsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    lessonsSuccess: (state, action) => {
      state.isLoading = false;
      state.modules = action.payload;
    },
    lessonDetailSuccess: (state, action) => {
      state.isLoading = false;
      state.currentLesson = action.payload;
    },
    moduleDetailSuccess: (state, action) => {
      state.isLoading = false;
      state.currentModule = action.payload;
    },
    lessonsFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearCurrent: (state) => {
      state.currentModule = null;
      state.currentLesson = null;
    },
  },
});

export const {
  lessonsStart,
  lessonsSuccess,
  lessonDetailSuccess,
  moduleDetailSuccess,
  lessonsFailure,
  clearCurrent,
} = lessonSlice.actions;
export default lessonSlice.reducer;
