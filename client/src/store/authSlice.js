import { createSlice } from '@reduxjs/toolkit';

const storedUser = localStorage.getItem('icgla_user');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: localStorage.getItem('icgla_token') || null,
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('icgla_token'),
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      const { user, token } = action.payload;
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = user;
      state.token = token;
      localStorage.setItem('icgla_token', token);
      localStorage.setItem('icgla_user', JSON.stringify(user));
    },
    authFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('icgla_token');
      localStorage.removeItem('icgla_user');
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('icgla_user', JSON.stringify(action.payload));
    },
  },
});

export const { authStart, authSuccess, authFailure, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
