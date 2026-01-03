'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isTokenValid } from './jwt';

// =============================================================================
// TYPES
// =============================================================================

export interface User {
  id: number;
  nim: string;
  name: string;
  email?: string;
  role: 'admin' | 'user';
  kelas?: string;
  has_face?: boolean;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  validateSession: () => boolean;
  clearAuth: () => void;
}

// =============================================================================
// AUTH STORE
// =============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      // start in loading state until persistence rehydrates
      isLoading: true,

      setAuth: (user: User, accessToken: string, refreshToken: string) => {
        console.log('🔐 Setting auth for user:', user.nim);
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
        }

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        console.log('👋 Logging out user');
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      clearAuth: () => {
        console.log('🧹 Clearing auth data');
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (updatedUser: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const newUser = { ...currentUser, ...updatedUser };
          
          // Update localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(newUser));
          }

          set({ user: newUser });
        }
      },

      validateSession: () => {
        const state = get();
        
        // If no user or tokens, session is invalid
        if (!state.user || !state.accessToken || !state.refreshToken) {
          console.warn('⚠️ No user or tokens found');
          return false;
        }

        // Check if refresh token is still valid
        if (!isTokenValid(state.refreshToken)) {
          console.warn('⚠️ Refresh token expired, clearing session');
          get().clearAuth();
          return false;
        }

        // Access token can be expired (will be auto-refreshed by interceptor)
        // But refresh token must be valid
        console.log('✅ Session is valid');
        return true;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        console.log('🔄 Rehydrating auth state...');
        
        return (state, error) => {
          if (error) {
            console.error('❌ Rehydration error:', error);
            if (state) {
              state.isLoading = false;
              state.isAuthenticated = false;
            }
            return;
          }
          
          if (state) {
            // Validate session after rehydration
            const isValid = state.validateSession();
            
            if (!isValid) {
              console.warn('⚠️ Session invalid after rehydration, clearing state');
              state.isAuthenticated = false;
              state.user = null;
              state.accessToken = null;
              state.refreshToken = null;
            } else {
              console.log('✅ Session valid after rehydration');
            }
            
            // Always set isLoading to false after rehydration
            state.isLoading = false;
            console.log('✅ Rehydration complete, isLoading set to false');
          }
        };
      },
    }
  )
);
