import { create } from 'zustand';
import type { User } from '../types/user.types';
import type { LoginRequest, RegisterRequest } from '../types/auth.types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: authService.getUserFromStorage(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear state even if API call fails
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  loadUser: () => {
    const user = authService.getUserFromStorage();
    const isAuthenticated = authService.isAuthenticated();
    set({ user, isAuthenticated });
  },

  clearError: () => {
    set({ error: null });
  },
}));
