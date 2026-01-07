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
   * Get attendance records with filters
   */
  async getAttendance(params?: AttendanceFilter): Promise<PaginatedResponse<Attendance>> {
    const response = await api.get<PaginatedResponse<Attendance>>('/admin/attendance', { params });
    return response.data;
  },

  /**
   * Export attendance to CSV
   */
  async exportAttendanceCSV(params?: AttendanceFilter): Promise<Blob> {
    const response = await api.get('/admin/students/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Delete attendance record
   */
  async deleteAttendance(id: number): Promise<void> {
    await api.delete(`/admin/attendance/${id}`);
  },
};
