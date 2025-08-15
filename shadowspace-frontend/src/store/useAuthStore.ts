// src/stores/useAuthStore.ts
import { create } from 'zustand';

/* ---------- Types ---------- */
interface User {
  id: string;
  username: string;
  anonymousName: string;
}

interface AuthState {
  /* state */
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;

  /* actions */
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

/* ---------- Helpers ---------- */
const API_BASE_URL = 'https://shadowspace-t0v1.onrender.com/api';

/** Safe localStorage access (⇢ no crash during SSR) */
const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('shadowspace_token') : null;
const setToken = (t: string | null) =>
  typeof window !== 'undefined' && (t ? localStorage.setItem('shadowspace_token', t)
                                      : localStorage.removeItem('shadowspace_token'));

/** Enhanced fetch wrapper with proper error handling */
const jsonRequest = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      // Handle specific HTTP status codes
      if (res.status === 401) {
        throw new Error('Invalid username or password');
      } else if (res.status === 404) {
        throw new Error('User not found');
      } else if (res.status === 409) {
        throw new Error('Username already exists. Please choose a different one');
      } else if (res.status === 400) {
        throw new Error(data.message || data.error || 'Invalid input data');
      } else if (res.status >= 500) {
        throw new Error('Server error. Please try again later');
      } else {
        throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
      }
    }

    return data as T;
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again');
    } else if (error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection');
    } else {
      // Re-throw the error with original message
      throw error;
    }
  }
};

/* ---------- Zustand store ---------- */
export const useAuthStore = create<AuthState>((set) => ({
  /* initial state */
  isAuthenticated: false,
  user: null,
  token: getToken(),

  /* actions */
  login: async (username, password) => {
    try {
      const data = await jsonRequest<{ user: User; token: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ username, password }) },
      );

      setToken(data.token);
      set({ isAuthenticated: true, user: data.user, token: data.token });
    } catch (error: any) {
      console.error('Login error:', error.message);
      throw error; // Re-throw for the UI to handle
    }
  },

  register: async (username, password) => {
    try {
      /* Generate a random anonymous name */
      const anonymousName = 'anon_' + Date.now().toString(36).slice(-4);

      const data = await jsonRequest<{ user: User; token: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ username, password, anonymousName }) },
      );

      setToken(data.token);
      set({ isAuthenticated: true, user: data.user, token: data.token });
    } catch (error: any) {
      console.error('Register error:', error.message);
      throw error; // Re-throw for the UI to handle
    }
  },

  logout: () => {
    setToken(null);
    set({ isAuthenticated: false, user: null, token: null });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // Fixed: removed underscore

      const data = await jsonRequest<{ user: User }>('/auth/verify', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      set({ isAuthenticated: true, user: data.user, token });
    } catch (error) {
      console.warn('Auth check failed:', error);
      setToken(null);
      set({ isAuthenticated: false, user: null, token: null });
    }
  },
}));
