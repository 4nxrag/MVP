import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  anonymousName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const API_BASE_URL = 'https://shadowspace-t0v1.onrender.com/api';

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('shadowspace_token'),

  login: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('shadowspace_token', data.token);
      
      // Update state
      set({
        isAuthenticated: true,
        user: data.user,
        token: data.token,
      });

    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  register: async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('shadowspace_token', data.token);
      
      // Update state
      set({
        isAuthenticated: true,
        user: data.user,
        token: data.token,
      });

    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  logout: () => {
    // Remove token from localStorage
    localStorage.removeItem('shadowspace_token');
    
    // Clear state
    set({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  },

  checkAuth: async () => {
  try {
    const token = localStorage.getItem('shadowspace_token');
    
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal, // Add timeout signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      localStorage.removeItem('shadowspace_token');
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    const data = await response.json();
    set({
      isAuthenticated: true,
      user: data.user,
      token: token,
    });

  } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('shadowspace_token');
    set({ isAuthenticated: false, user: null, token: null });
  }
},

}));
