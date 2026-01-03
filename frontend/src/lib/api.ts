import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { isTokenValid } from './jwt';

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Track if we're currently refreshing token to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Function to get token - ALWAYS from localStorage direct
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
};

// Function to update tokens in localStorage
const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  console.log('✅ Tokens updated in localStorage');
};

// Function to clear all auth data
const clearAuthData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('auth-storage');
  console.log('🧹 Auth data cleared from localStorage');
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = getAccessToken();
    console.log('🔐 API Request:', config.method?.toUpperCase(), config.url);
    
    // Skip token validation for auth endpoints
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register') ||
                          config.url?.includes('/auth/refresh');
    
    if (!isAuthEndpoint && token) {
      // Check if token is expired
      if (!isTokenValid(token)) {
        console.warn('⚠️ Access token expired, attempting refresh...');
        
        const refreshToken = getRefreshToken();
        if (!refreshToken || !isTokenValid(refreshToken)) {
          console.error('❌ Refresh token invalid or expired, clearing auth data');
          clearAuthData();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Session expired'));
        }
        
        // Try to refresh token
        try {
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token: new_refresh_token } = response.data;
          setTokens(access_token, new_refresh_token);
          
          // Update request with new token
          config.headers.Authorization = `Bearer ${access_token}`;
          console.log('✅ Token refreshed successfully');
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
          clearAuthData();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header set with valid token');
      }
    } else if (!isAuthEndpoint && !token) {
      console.error('❌ NO TOKEN FOUND in localStorage!');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, 'Status:', response.status);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    console.error('❌ API Error:', originalRequest?.method?.toUpperCase(), originalRequest?.url);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error data:', error.response?.data);
    
    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Skip retry for auth endpoints
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                            originalRequest.url?.includes('/auth/register') ||
                            originalRequest.url?.includes('/auth/refresh');
      
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
      
      // Mark request as retried
      originalRequest._retry = true;
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            const newToken = getAccessToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      isRefreshing = true;
      
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        console.error('❌ No refresh token available');
        isRefreshing = false;
        clearAuthData();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      try {
        console.log('🔄 Attempting to refresh token...');
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken
        });
        
        const { access_token, refresh_token: new_refresh_token } = response.data;
        setTokens(access_token, new_refresh_token);
        
        // Update original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        
        processQueue(null);
        isRefreshing = false;
        
        console.log('✅ Token refreshed, retrying original request');
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        processQueue(refreshError);
        isRefreshing = false;
        clearAuthData();
        
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle network errors (server down)
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('❌ Network error - Server might be down');
      // Don't clear auth data on network errors - server might just be restarting
    }
    
    return Promise.reject(error);
  }
);

// =============================================================================
// AUTH API
// =============================================================================

export const authApi = {
  login: async (credentials: { nim: string; password: string }) => {
    return api.post('/api/v1/auth/login', credentials);
  },

  register: async (data: { nim: string; name: string; password: string; email?: string }) => {
    return api.post('/api/v1/auth/register', data);
  },

  logout: async () => {
    return api.post('/api/v1/auth/logout');
  },

  getMe: async () => {
    return api.get('/api/v1/auth/me');
  },

  changePassword: async (data: { current_password: string; new_password: string }) => {
    return api.put('/api/v1/auth/change-password', data);
  },

  refreshToken: async (refresh_token: string) => {
    return api.post('/api/v1/auth/refresh', { refresh_token });
  },
};

// =============================================================================
// FACE API
// =============================================================================

export const faceAPI = {
  scan: async (base64Image: string) => {
    return api.post('/api/v1/face/scan', {
      image_base64: base64Image,
    });
  },

  register: async (images: string[]) => {
    return api.post('/api/v1/face/register', {
      images_base64: images,
    });
  },

  registerUpload: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return api.post('/api/v1/face/register-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  adminRegister: async (studentId: number, images: string[]) => {
    return api.post(`/api/v1/face/admin/register/${studentId}`, {
      images_base64: images,
    });
  },

  adminRegisterUpload: async (studentId: number, files: File[]) => {
    const formData = new FormData();
    formData.append('student_id', studentId.toString());
    files.forEach((file) => {
      formData.append('files', file);
    });
    return api.post(`/api/v1/face/admin/register-upload/${studentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  verify: async (base64Image: string) => {
    return api.post('/api/v1/face/verify', {
      image_base64: base64Image,
    });
  },

  unregister: async () => {
    return api.delete('/api/v1/face/unregister');
  },

  adminUnregister: async (studentId: number) => {
    return api.delete(`/api/v1/face/admin/unregister/${studentId}`);
  },

  getStatus: async () => {
    return api.get('/api/v1/face/status');
  },

  getRegisteredUsers: async () => {
    return api.get('/api/v1/face/registered-users');
  },
};

// =============================================================================
// ABSENSI API
// =============================================================================

export const absensiAPI = {
  submit: async (data: { image_base64: string }) => {
    return api.post('/api/v1/absensi/submit', data);
  },

  getHistory: async (params?: { skip?: number; limit?: number; start_date?: string; end_date?: string }) => {
    return api.get('/api/v1/absensi/history', { params });
  },

  getToday: async () => {
    return api.get('/api/v1/absensi/today');
  },

  getStats: async () => {
    return api.get('/api/v1/absensi/statistics');
  },

  checkStatus: async () => {
    return api.get('/api/v1/absensi/today');
  },

  // Admin endpoints
  getAll: async (params?: { skip?: number; limit?: number; start_date?: string; end_date?: string; kelas?: string }) => {
    return api.get('/api/v1/admin/students', { params });
  },

  getAdminStats: async (params?: { start_date?: string; end_date?: string }) => {
    return api.get('/api/v1/admin/statistics/date', { params });
  },

  export: async (params?: { start_date?: string; end_date?: string; format?: 'csv' | 'json' }) => {
    return api.get('/api/v1/admin/report', { params, responseType: params?.format === 'csv' ? 'blob' : 'json' });
  },

  getDailyReport: async (date: string) => {
    return api.get('/api/v1/admin/statistics/date', { params: { target_date: date } });
  },
};

// =============================================================================
// ADMIN API
// =============================================================================

export const adminAPI = {
  getDashboard: async () => {
    return api.get('/api/v1/admin/dashboard');
  },

  getStatistics: async (params?: { start_date?: string; end_date?: string }) => {
    return api.get('/api/v1/admin/statistics/date', { params });
  },

  getStudents: async (params?: { skip?: number; limit?: number; kelas?: string; has_face?: boolean }) => {
    return api.get('/api/v1/admin/students', { params });
  },

  getStudentsWithoutFace: async () => {
    return api.get('/api/v1/admin/students', { params: { has_face: false } });
  },

  getStudentsWithFace: async () => {
    return api.get('/api/v1/admin/students', { params: { has_face: true } });
  },

  createStudent: async (data: { nim: string; name: string; password: string; email?: string; kelas?: string }) => {
    return api.post('/api/v1/admin/students', data);
  },

  bulkCreateStudents: async (students: Array<{ nim: string; name: string; password: string; email?: string; kelas?: string }>) => {
    return api.post('/api/v1/admin/students/bulk', students);
  },

  importStudentsCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/v1/admin/students/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getStudentsDropdown: async () => {
    return api.get('/api/v1/admin/students', { params: { limit: 1000 } });
  },

  deleteStudent: async (studentId: number) => {
    return api.delete(`/api/v1/admin/students/${studentId}`);
  },

  getUsers: async (params?: { skip?: number; limit?: number; kelas?: string }) => {
    return api.get('/api/v1/admin/students', { params });
  },

  createUser: async (data: { nim: string; name: string; password: string; email?: string; kelas?: string }) => {
    return api.post('/api/v1/admin/students', data);
  },

  getUser: async (userId: number) => {
    return api.get(`/api/v1/admin/students`, { params: { skip: 0, limit: 1000 } });
  },

  updateUser: async (userId: number, data: { name?: string; email?: string; kelas?: string; password?: string; is_active?: boolean }) => {
    return api.put(`/api/v1/admin/students/${userId}`, data);
  },

  deleteUser: async (userId: number) => {
    return api.delete(`/api/v1/admin/students/${userId}`);
  },

  getReport: async (params?: { start_date?: string; end_date?: string; kelas?: string; format?: 'json' | 'csv' }) => {
    return api.get('/api/v1/admin/report', { params, responseType: params?.format === 'csv' ? 'blob' : 'json' });
  },

  makeAdmin: async (userId: number) => {
    return api.put(`/api/v1/admin/students/${userId}`, { role: 'admin' });
  },

  revokeAdmin: async (userId: number) => {
    return api.put(`/api/v1/admin/students/${userId}`, { role: 'user' });
  },
};

// =============================================================================
// PUBLIC API (No authentication required)
// =============================================================================

export const publicApi = {
  scanAttendance: async (base64Image: string) => {
    return api.post('/api/v1/face/scan', {
      image_base64: base64Image,
    });
  },

  getHistory: async (nim: string) => {
    // This endpoint doesn't exist in backend, using today stats instead
    return api.get('/api/v1/public/today-stats');
  },

  checkStatus: async (nim: string) => {
    // This endpoint doesn't exist in backend, using today stats instead
    return api.get('/api/v1/public/today-stats');
  },

  getTodayStats: async () => {
    return api.get('/api/v1/public/today-stats');
  },

  getLatestAttendance: async (limit: number = 10) => {
    return api.get('/api/v1/public/latest-attendance', { params: { limit } });
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const canvasToBase64 = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
};

export default api;

