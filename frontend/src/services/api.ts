import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to headers
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response: any) => {
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh token
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        // Retry original request with new token
        if (originalRequest && originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
      
      // Don't show toast for 401 (already handled above)
      if (error.response.status !== 401) {
        toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
