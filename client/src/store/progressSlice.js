import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  myProgress: null,
  isLoading: false,
  error: null,
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    progressStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    progressSuccess: (state, action) => {
      state.isLoading = false;
      state.myProgress = action.payload;
    },
    progressFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    resetProgress: (state) => {
      state.myProgress = null;
      state.error = null;
    },
  },
});

export const { progressStart, progressSuccess, progressFailure, resetProgress } =
  progressSlice.actions;
export default progressSlice.reducer;
