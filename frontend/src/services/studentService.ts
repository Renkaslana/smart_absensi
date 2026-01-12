import api from './api';

// ==================== TYPES ====================
export interface StudentDashboardSummary {
  total_hadir: number;
  total_sakit: number;
  total_izin: number;
  total_alpa: number;
  persentase_kehadiran: number;
  total_pertemuan: number;
}

export interface Schedule {
  id: number;
  hari: string;
  waktu_mulai: string;
  waktu_selesai: string;
  mata_pelajaran: string;
  guru: string;
  ruangan: string;
  kode_kelas: string;
}

export interface AttendanceRecord {
  id: number;
  tanggal: string;
  waktu: string;
  mata_pelajaran: string;
  guru: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alpa';
  method: 'face_recognition' | 'manual';
  confidence?: number;
  keterangan?: string;
}

export interface AttendanceHistoryResponse {
  data: AttendanceRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FaceRegistrationStatus {
  status: 'complete' | 'partial' | 'not_registered';
  total_photos: number;
  required_photos: number;
  photos: FacePhoto[];
}

export interface FacePhoto {
  id: number;
  image_url: string;
  quality_score: number;
  uploaded_at: string;
}

export interface StudentProfile {
  id: number;
  name: string;
  email: string;
  username: string; // NIS
  phone?: string;
  address?: string;
  birth_date?: string;
  kelas: string;
  tahun_masuk: number;
  wali_kelas?: string;
}

export interface UpdateProfileData {
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
 * Get student dashboard summary (attendance statistics)
 */
export const getStudentDashboardSummary = async (): Promise<StudentDashboardSummary> => {
  const response = await api.get('/students/dashboard/summary');
  return response.data;
};

/**
 * Get student weekly schedule
 * @param week - Week number (optional, defaults to current week)
 */
export const getStudentSchedule = async (week?: number): Promise<Schedule[]> => {
  const params = week ? { week } : {};
  const response = await api.get('/students/schedule', { params });
  return response.data;
};

/**
 * Get student attendance history with filters
 */
export const getAttendanceHistory = async (params?: {
  date_start?: string;
  date_end?: string;
  status?: 'hadir' | 'sakit' | 'izin' | 'alpa';
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<AttendanceHistoryResponse> => {
  const response = await api.get('/students/attendance/history', { params });
  return response.data;
};

/**
 * Export attendance history to CSV
 */
export const exportAttendanceHistory = async (params?: {
  date_start?: string;
  date_end?: string;
  status?: string;
}): Promise<Blob> => {
  const response = await api.get('/students/attendance/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get face registration status
 */
export const getFaceRegistrationStatus = async (): Promise<FaceRegistrationStatus> => {
  const response = await api.get('/students/face/status');
  return response.data;
};

/**
 * Register face photo
 * @param imageData - Base64 encoded image or File
 */
export const registerFacePhoto = async (imageData: string | File): Promise<FacePhoto> => {
  const formData = new FormData();
  
  if (typeof imageData === 'string') {
    // Base64 string
    const blob = await (await fetch(imageData)).blob();
    formData.append('image', blob, 'face-photo.jpg');
  } else {
    // File object
    formData.append('image', imageData);
  }

  const response = await api.post('/students/face/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * Delete face photo
 */
export const deleteFacePhoto = async (photoId: number): Promise<void> => {
  await api.delete(`/students/face/photos/${photoId}`);
};

/**
 * Get student profile
 */
export const getStudentProfile = async (): Promise<StudentProfile> => {
  const response = await api.get('/students/profile');
  return response.data;
};

/**
 * Update student profile
 */
export const updateStudentProfile = async (data: UpdateProfileData): Promise<StudentProfile> => {
  const response = await api.put('/students/profile', data);
  return response.data;
};

/**
 * Change password
 */
export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  await api.post('/students/password/change', data);
};

/**
 * Mark attendance (for student self-attendance)
 */
export const markAttendance = async (data: {
  kelas_id: number;
  method: 'face_recognition' | 'manual';
  image?: string; // Base64 for face recognition
  keterangan?: string;
}): Promise<{
  success: boolean;
  message: string;
  confidence?: number;
  attendance_id: number;
  already_submitted?: boolean;  // Flag untuk duplikasi
  data?: {
    already_submitted?: boolean;
    timestamp?: string;
  };
}> => {
  const response = await api.post('/students/attendance/mark', data);
  return response.data;
};

export default {
  getStudentDashboardSummary,
  getStudentSchedule,
  getAttendanceHistory,
  exportAttendanceHistory,
  getFaceRegistrationStatus,
  registerFacePhoto,
  deleteFacePhoto,
  getStudentProfile,
  updateStudentProfile,
  changePassword,
  markAttendance,
};
