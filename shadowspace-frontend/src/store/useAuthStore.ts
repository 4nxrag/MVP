import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  anonymousName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const API_BASE = 'http://localhost:5000/api';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('shadowspace_token'),
  isAuthenticated: false,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('shadowspace_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  register: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        username,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('shadowspace_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('shadowspace_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ user: response.data.user, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('shadowspace_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  }
}));
