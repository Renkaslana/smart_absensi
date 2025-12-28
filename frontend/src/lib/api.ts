import axios, { AxiosInstance, AxiosError } from 'axios';

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Function to get token - ALWAYS from localStorage direct
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
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
  (config) => {
    const token = getAccessToken();
    console.log('🔐 API Request:', config.method?.toUpperCase(), config.url);
    console.log('🔑 Token from localStorage:', token ? token.substring(0, 50) + '...' : 'NULL');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header set');
    } else {
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
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Got 401 - redirecting to login');
      // Don't clear tokens aggressively - just redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
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

