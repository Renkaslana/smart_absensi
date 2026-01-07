import api from './api';
import type { LoginRequest, RegisterRequest, TokenResponse, ChangePasswordRequest } from '../types/auth.types';
import type { User } from '../types/user.types';

export const authService = {
  /**
   * Login with NIM and password
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', credentials);
    
    // Store tokens and user
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/register', data);
    
    // Store tokens and user
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    
    // Update stored user
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.put('/auth/password', data);
  },

  /**
   * Get user from localStorage
   */
  getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getUserFromStorage();
    return user?.role === role;
  },
};
