import axios, { AxiosInstance, AxiosError } from 'axios';

// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

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
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Token expired, try to refresh
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: new_refresh_token } = response.data;
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access_token);
            if (new_refresh_token) {
              localStorage.setItem('refresh_token', new_refresh_token);
            }
          }
          // Retry original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${access_token}`;
            return api.request(error.config);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
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
    return api.post('/auth/login', credentials);
  },

  register: async (data: { nim: string; name: string; password: string; email?: string }) => {
    return api.post('/auth/register', data);
  },

  logout: async () => {
    return api.post('/auth/logout');
  },

  getMe: async () => {
    return api.get('/auth/me');
  },

  changePassword: async (data: { current_password: string; new_password: string }) => {
    return api.put('/auth/change-password', data);
  },

  refreshToken: async (refresh_token: string) => {
    return api.post('/auth/refresh', { refresh_token });
  },
};

// =============================================================================
// FACE API
// =============================================================================

export const faceAPI = {
  scan: async (base64Image: string) => {
    return api.post('/face/scan', {
      image: base64Image,
    });
  },

  register: async (images: string[]) => {
    return api.post('/face/register', {
      images,
    });
  },

  registerUpload: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return api.post('/face/register-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  adminRegister: async (studentId: number, images: string[]) => {
    return api.post('/face/admin/register', {
      student_id: studentId,
      images,
    });
  },

  adminRegisterUpload: async (studentId: number, files: File[]) => {
    const formData = new FormData();
    formData.append('student_id', studentId.toString());
    files.forEach((file) => {
      formData.append('files', file);
    });
    return api.post('/face/admin/register-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  verify: async (base64Image: string) => {
    return api.post('/face/verify', {
      image: base64Image,
    });
  },

  unregister: async () => {
    return api.delete('/face/unregister');
  },

  adminUnregister: async (studentId: number) => {
    return api.delete(`/face/admin/unregister/${studentId}`);
  },

  getStatus: async () => {
    return api.get('/face/status');
  },

  getRegisteredUsers: async () => {
    return api.get('/face/registered-users');
  },
};

// =============================================================================
// ABSENSI API
// =============================================================================

export const absensiAPI = {
  submit: async (data: { image: string; device_info?: string }) => {
    return api.post('/absensi/submit', data);
  },

  getHistory: async (params?: { limit?: number; offset?: number; start_date?: string; end_date?: string }) => {
    return api.get('/absensi/history', { params });
  },

  getToday: async () => {
    return api.get('/absensi/today');
  },

  getStats: async () => {
    return api.get('/absensi/statistics');
  },

  checkStatus: async () => {
    return api.get('/absensi/check-status');
  },

  // Admin endpoints
  getAll: async (params?: { limit?: number; offset?: number; start_date?: string; end_date?: string; nim?: string }) => {
    return api.get('/absensi/admin/all', { params });
  },

  getAdminStats: async (params?: { start_date?: string; end_date?: string }) => {
    return api.get('/absensi/admin/statistics', { params });
  },

  export: async (params?: { start_date?: string; end_date?: string; format?: 'csv' | 'excel' }) => {
    return api.get('/absensi/admin/export', { params, responseType: 'blob' });
  },

  getDailyReport: async (date: string) => {
    return api.get('/absensi/admin/daily-report', { params: { date } });
  },
};

// =============================================================================
// ADMIN API
// =============================================================================

export const adminAPI = {
  getDashboard: async () => {
    return api.get('/admin/dashboard');
  },

  getStatistics: async (params?: { start_date?: string; end_date?: string }) => {
    return api.get('/admin/statistics', { params });
  },

  getStudents: async (params?: { limit?: number; offset?: number; search?: string }) => {
    return api.get('/admin/students', { params });
  },

  getStudentsWithoutFace: async () => {
    return api.get('/admin/students/without-face');
  },

  getStudentsWithFace: async () => {
    return api.get('/admin/students/with-face');
  },

  createStudent: async (data: { nim: string; name: string; email?: string; kelas?: string }) => {
    return api.post('/admin/students', data);
  },

  bulkCreateStudents: async (students: Array<{ nim: string; name: string; email?: string; kelas?: string }>) => {
    return api.post('/admin/students/bulk', { students });
  },

  getStudentsDropdown: async () => {
    return api.get('/admin/students/dropdown');
  },

  getUsers: async (params?: { limit?: number; offset?: number; role?: string; search?: string }) => {
    return api.get('/admin/users', { params });
  },

  createUser: async (data: { nim: string; name: string; password: string; email?: string; role?: string }) => {
    return api.post('/admin/users', data);
  },

  getUser: async (userId: number) => {
    return api.get(`/admin/users/${userId}`);
  },

  updateUser: async (userId: number, data: { name?: string; email?: string; role?: string; password?: string }) => {
    return api.put(`/admin/users/${userId}`, data);
  },

  deleteUser: async (userId: number) => {
    return api.delete(`/admin/users/${userId}`);
  },

  getReport: async (params?: { start_date?: string; end_date?: string; format?: 'json' | 'csv' | 'excel' }) => {
    return api.get('/admin/report', { params });
  },

  makeAdmin: async (userId: number) => {
    return api.post(`/admin/make-admin/${userId}`);
  },

  revokeAdmin: async (userId: number) => {
    return api.post(`/admin/revoke-admin/${userId}`);
  },
};

// =============================================================================
// PUBLIC API (No authentication required)
// =============================================================================

export const publicApi = {
  scanAttendance: async (base64Image: string, deviceInfo?: string) => {
    return api.post('/public/scan-attendance', {
      image: base64Image,
      device_info: deviceInfo,
    });
  },

  getHistory: async (nim: string) => {
    return api.get(`/public/history/${nim}`);
  },

  checkStatus: async (nim: string) => {
    return api.get(`/public/check-status/${nim}`);
  },

  getTodayStats: async () => {
    return api.get('/public/today-stats');
  },

  getLatestAttendance: async () => {
    return api.get('/public/latest-attendance');
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const canvasToBase64 = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
};

export default api;

