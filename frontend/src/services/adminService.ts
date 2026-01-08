import api from './api';
import type { User, UserCreate, UserUpdate, UserWithStats } from '../types/user.types';
import type { Attendance, AttendanceFilter } from '../types/attendance.types';
import type { PaginatedResponse } from '../types/api.types';

export interface DashboardStats {
  total_students: number;
  students_with_face: number;
  face_registration_percentage: number;
  today_present: number;
  today_absent: number;
  today_statistics: {
    total_present: number;
    unique_students: number;
    average_confidence: number;
  };
  month_total_attendance: number;
}

export const adminService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/admin/dashboard');
    return response.data;
  },

  /**
   * Get all students with pagination and filters
   */
  async getStudents(params?: {
    skip?: number;
    limit?: number;
    kelas?: string;
    has_face?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<UserWithStats>> {
    const response = await api.get<PaginatedResponse<UserWithStats>>('/admin/students', { params });
    return response.data;
  },

  /**
   * Get all teachers
   */
  async getTeachers(params?: {
    skip?: number;
    limit?: number;
  }): Promise<PaginatedResponse<UserWithStats>> {
    const response = await api.get<PaginatedResponse<UserWithStats>>('/admin/teachers', { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserWithStats> {
    const response = await api.get<UserWithStats>(`/admin/students/${id}`);
    return response.data;
  },

  /**
   * Create new student
   */
  async createStudent(data: UserCreate): Promise<User> {
    const response = await api.post<User>('/admin/students', data);
    return response.data;
  },

  /**
   * Create new teacher
   */
  async createTeacher(data: UserCreate): Promise<User> {
    const response = await api.post<User>('/admin/teachers', { ...data, role: 'teacher' });
    return response.data;
  },

  /**
   * Update user
   */
  async updateUser(id: number, data: UserUpdate): Promise<User> {
    const response = await api.put<User>(`/admin/students/${id}`, data);
    return response.data;
  },

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/admin/students/${id}`);
  },

  /**
   * Admin register face for any user
   */
  async adminRegisterFace(userId: number, imagesBase64: string[]): Promise<any> {
    const response = await api.post(`/face/admin/register/${userId}`, {
      images_base64: imagesBase64,
    });
    return response.data;
  },

  /**
   * Admin unregister face for any user
   */
  async adminUnregisterFace(userId: number): Promise<void> {
    await api.delete(`/face/admin/unregister/${userId}`);
  },

  /**
   * Get attendance records with filters
   */
  async getAttendance(params?: AttendanceFilter): Promise<PaginatedResponse<Attendance>> {
    const response = await api.get<PaginatedResponse<Attendance>>('/admin/attendance', { params });
    return response.data;
  },

  /**
   * Export attendance report to CSV
   */
  async exportAttendanceCSV(params: {
    start_date: string;
    end_date: string;
    kelas?: string;
  }): Promise<Blob> {
    const response = await api.get('/admin/report', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get attendance report (JSON)
   */
  async getAttendanceReport(params: {
    start_date: string;
    end_date: string;
    kelas?: string;
  }): Promise<any> {
    const response = await api.get('/admin/report', {
      params: { ...params, format: 'json' },
    });
    return response.data;
  },

  /**
   * Get date-specific statistics
   */
  async getDateStatistics(params: {
    target_date: string;
    kelas?: string;
  }): Promise<any> {
    const response = await api.get('/admin/statistics/date', { params });
    return response.data;
  },

  /**
   * Get user details with attendance history
   */
  async getUserDetails(id: number): Promise<any> {
    const response = await api.get(`/admin/students/${id}`);
    return response.data;
  },

  /**
   * Get user attendance history
   */
  async getUserAttendanceHistory(userId: number, params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const response = await api.get(`/admin/students/${userId}/attendance`, { params });
    return response.data;
  },

  /**
   * Bulk import students from CSV
   */
  async importStudentsCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/students/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Admin submit attendance on behalf of student
   */
  async submitAttendance(imageBase64: string): Promise<any> {
    const response = await api.post('/admin/submit-attendance', {
      image_base64: imageBase64,
    });
    return response.data;
  },

  /**
   * =================
   * KELAS MANAGEMENT
   * =================
   */

  /**
   * Get all kelas with pagination and filters
   */
  async getKelas(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<any> {
    const response = await api.get('/admin/classrooms', { params });
    // backend currently returns a PaginatedResponse with `items` field
    // normalize to return the items array for list rendering
    return response.data?.items ?? response.data;
  },

  /**
   * Get kelas options for dropdown (only active)
   */
  async getKelasOptions(): Promise<Array<{ value: string; label: string; id: number }>> {
    const response = await api.get('/admin/classrooms/options/list');
    return response.data;
  },

  /**
   * Get kelas detail by ID
   */
  async getKelasDetail(id: number): Promise<any> {
    const response = await api.get(`/admin/classrooms/${id}`);
    return response.data;
  },

  /**
   * Create new kelas
   */
  async createKelas(data: {
    code: string;
    name: string;
    description?: string;
    capacity?: number;
    academic_year?: string;
    semester?: number;
  }): Promise<any> {
    const response = await api.post('/admin/classrooms', data);
    return response.data;
  },

  /**
   * Update kelas
   */
  async updateKelas(id: number, data: any): Promise<any> {
    const response = await api.put(`/admin/classrooms/${id}`, data);
    return response.data;
  },

  /**
   * Delete kelas
   */
  async deleteKelas(id: number): Promise<void> {
    await api.delete(`/admin/classrooms/${id}`);
  },
};
