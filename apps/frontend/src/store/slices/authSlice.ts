import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Secure JWT decoder utility
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const getInitialState = (): AuthState => {
  const token = localStorage.getItem('notifyiq_token');
  if (!token) {
    return {
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  const decoded = decodeJwt(token);
  const isExpired = decoded && decoded.exp ? decoded.exp * 1000 < Date.now() : true;

  if (isExpired) {
    localStorage.removeItem('notifyiq_token');
    localStorage.removeItem('notifyiq_workspace');
    return {
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  return {
    token,
    user: {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ token: string; user: User }>) {
      state.isLoading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('notifyiq_token', action.payload.token);
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem('notifyiq_token');
      localStorage.removeItem('notifyiq_workspace');
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setUser } = authSlice.actions;
export default authSlice.reducer;
