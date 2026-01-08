import api from './api';

// ==================== TYPES ====================
export interface PublicAttendanceResult {
  success: boolean;
  message: string;
  student?: {
    id: number;
    name: string;
    nis: string;
    kelas: string;
  };
  attendance?: {
    id: number;
    mata_pelajaran: string;
    ruangan: string;
    waktu: string;
  };
  confidence?: number;
}

export interface KioskInfo {
  kelas_id: number;
  mata_pelajaran: string;
  ruangan: string;
  guru: string;
  waktu_mulai: string;
  waktu_selesai: string;
}

// ==================== API CALLS ====================

/**
 * Mark attendance via public kiosk using face recognition
 * @param imageData - Base64 encoded image from camera
 * @param location - Optional location identifier
 */
export const markPublicAttendance = async (data: {
  image: string; // Base64 image
  location?: string;
  kelas_id?: number;
}): Promise<PublicAttendanceResult> => {
  const response = await api.post('/public/attendance/mark', data);
  return response.data;
};

/**
 * Get current kiosk information (active class session)
 * @param kioskId - Optional kiosk identifier
 */
export const getKioskInfo = async (kioskId?: string): Promise<KioskInfo> => {
  const params = kioskId ? { kiosk_id: kioskId } : {};
  const response = await api.get('/public/kiosk/info', { params });
  return response.data;
};

/**
 * Check if student face is registered (for public kiosk validation)
 * @param image - Base64 encoded image
 */
export const checkFaceRegistered = async (image: string): Promise<{
  registered: boolean;
  student_id?: number;
  name?: string;
  confidence?: number;
}> => {
  const response = await api.post('/public/face/check', { image });
  return response.data;
};

export default {
  markPublicAttendance,
  getKioskInfo,
  checkFaceRegistered,
};
