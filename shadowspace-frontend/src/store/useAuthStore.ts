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
  login:  (username: string, password: string) => Promise<void>;
  register:(username: string, password: string) => Promise<void>;
  logout:  () => void;
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

/** Shared fetch wrapper */
const jsonRequest = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = (await res.json()) as T;
  if (!res.ok) throw new Error((data as any).error || 'Request failed');
  return data;
};

/* ---------- Zustand store ---------- */
export const useAuthStore = create<AuthState>((set) => ({
  /* initial state */
  isAuthenticated: false,
  user: null,
  token: getToken(),

  /* actions */
  login: async (username, password) => {
    const data = await jsonRequest<{ user: User; token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) },
    );

    setToken(data.token);
    set({ isAuthenticated: true, user: data.user, token: data.token });
  },

  register: async (username, password) => {
    /* anonymousName is mandatory on the backend */
    const anonymousName = 'anon_' + Date.now().toString(36).slice(-4);

    const data = await jsonRequest<{ user: User; token: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ username, password, anonymousName }) },
    );

    setToken(data.token);
    set({ isAuthenticated: true, user: data.user, token: data.token });
  },

  logout: () => {
    setToken(null);
    set({ isAuthenticated: false, user: null, token: null });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) return set({ isAuthenticated: false, user: null, token: null });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const data = await jsonRequest<{ user: User }>('/auth/verify', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      set({ isAuthenticated: true, user: data.user, token });
    } catch {
      setToken(null);
      set({ isAuthenticated: false, user: null, token: null });
    }
  },
}));
