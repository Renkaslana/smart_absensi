import api from './api';

// ==================== TYPES ====================
export interface TeacherDashboardSummary {
  total_kelas: number;
  total_siswa: number;
  kelas_hari_ini: number;
  rata_rata_kehadiran: number;
}

export interface ClassData {
  id: number;
  kelas: string;
  mata_pelajaran: string;
  total_siswa: number;
  jadwal: string[]; // Array of time slots like "Senin 07:00-08:30"
  ruangan: string;
  attendance_rate: number;
}

export interface TodayClass {
  id: number;
  kelas: string;
  mata_pelajaran: string;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan: string;
  total_siswa: number;
  status: 'completed' | 'ongoing' | 'upcoming';
  attendance_marked: boolean;
  attendance_summary?: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
  };
}

export interface RecentActivity {
  id: number;
  kelas: string;
  tanggal: string;
  waktu: string;
  attendance_summary: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
  };
  persentase: number;
}

export interface StudentAttendance {
  id: number;
  name: string;
  nis: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alpa' | null;
}

export interface MarkAttendanceData {
  kelas_id: number;
  tanggal: string;
  students: Array<{
    student_id: number;
    status: 'hadir' | 'sakit' | 'izin' | 'alpa';
    keterangan?: string;
  }>;
}

export interface ReportFilters {
  kelas_id?: number;
  date_start?: string;
  date_end?: string;
  report_type?: 'summary' | 'detailed';
}

export interface ReportSummary {
  kelas: string;
  periode: string;
  total_siswa: number;
  total_pertemuan: number;
  rata_kehadiran: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
}

export interface TopStudent {
  rank: number;
  name: string;
  nis: string;
  attendance: number;
}

export interface TeacherProfile {
  id: number;
  name: string;
  email: string;
  username: string; // NIP
  phone?: string;
  address?: string;
  birth_date?: string;
  mata_pelajaran: string;
  classes: string[]; // Array of class names
  pendidikan: string;
  tahun_bergabung: number;
  pengalaman_tahun: number;
}

export interface UpdateTeacherProfileData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

// ==================== API CALLS ====================

/**
 * Get teacher dashboard summary
 */
export const getTeacherDashboardSummary = async (): Promise<TeacherDashboardSummary> => {
  const response = await api.get('/teachers/dashboard/summary');
  return response.data;
};

/**
 * Get today's classes for teacher
 */
export const getTodayClasses = async (): Promise<TodayClass[]> => {
  const response = await api.get('/teachers/classes/today');
  return response.data;
};

/**
 * Get recent attendance activity
 */
export const getRecentActivity = async (limit: number = 5): Promise<RecentActivity[]> => {
  const response = await api.get('/teachers/activity/recent', { params: { limit } });
  return response.data;
};

/**
 * Get all teacher's classes
 */
export const getTeacherClasses = async (): Promise<ClassData[]> => {
  const response = await api.get('/teachers/classes');
  return response.data;
};

/**
 * Get specific class details
 */
export const getClassDetails = async (classId: number): Promise<ClassData> => {
  const response = await api.get(`/teachers/classes/${classId}`);
  return response.data;
};

/**
 * Get students for attendance marking
 */
export const getStudentsForAttendance = async (
  classId: number,
  date: string
): Promise<StudentAttendance[]> => {
  const response = await api.get(`/teachers/classes/${classId}/students`, {
    params: { date },
  });
  return response.data;
};

/**
 * Mark attendance for multiple students
 */
export const markAttendance = async (data: MarkAttendanceData): Promise<{
  success: boolean;
  message: string;
  marked_count: number;
}> => {
  const response = await api.post('/teachers/attendance/mark', data);
  return response.data;
};

/**
 * Bulk face scan for attendance
 */
export const bulkFaceScan = async (data: {
  kelas_id: number;
  tanggal: string;
  images: string[]; // Array of base64 images
}): Promise<{
  success: boolean;
  recognized_count: number;
  students: Array<{
    student_id: number;
    name: string;
    confidence: number;
  }>;
}> => {
  const response = await api.post('/teachers/attendance/bulk-scan', data);
  return response.data;
};

/**
 * Generate attendance report
 */
export const generateReport = async (filters: ReportFilters): Promise<ReportSummary> => {
  const response = await api.get('/teachers/reports/generate', { params: filters });
  return response.data;
};

/**
 * Get top students (best attendance)
 */
export const getTopStudents = async (filters: {
  kelas_id?: number;
  date_start?: string;
  date_end?: string;
  limit?: number;
}): Promise<TopStudent[]> => {
  const response = await api.get('/teachers/reports/top-students', { params: filters });
  return response.data;
};

/**
 * Get low attendance students
 */
export const getLowAttendanceStudents = async (filters: {
  kelas_id?: number;
  date_start?: string;
  date_end?: string;
  threshold?: number; // e.g., 80 for students below 80%
  limit?: number;
}): Promise<TopStudent[]> => {
  const response = await api.get('/teachers/reports/low-attendance', { params: filters });
  return response.data;
};

/**
 * Export report to PDF
 */
export const exportReportPDF = async (filters: ReportFilters): Promise<Blob> => {
  const response = await api.get('/teachers/reports/export/pdf', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export report to Excel
 */
export const exportReportExcel = async (filters: ReportFilters): Promise<Blob> => {
  const response = await api.get('/teachers/reports/export/excel', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export report to CSV
 */
export const exportReportCSV = async (filters: ReportFilters): Promise<Blob> => {
  const response = await api.get('/teachers/reports/export/csv', {
    params: filters,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get teacher profile
 */
export const getTeacherProfile = async (): Promise<TeacherProfile> => {
  const response = await api.get('/teachers/profile');
  return response.data;
};

/**
 * Update teacher profile
 */
export const updateTeacherProfile = async (
  data: UpdateTeacherProfileData
): Promise<TeacherProfile> => {
  const response = await api.put('/teachers/profile', data);
  return response.data;
};

/**
 * Change password
 */
export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  await api.post('/teachers/password/change', data);
};

export default {
  getTeacherDashboardSummary,
  getTodayClasses,
  getRecentActivity,
  getTeacherClasses,
  getClassDetails,
  getStudentsForAttendance,
  markAttendance,
  bulkFaceScan,
  generateReport,
  getTopStudents,
  getLowAttendanceStudents,
  exportReportPDF,
  exportReportExcel,
  exportReportCSV,
  getTeacherProfile,
  updateTeacherProfile,
  changePassword,
};
