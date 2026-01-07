// Attendance Types
export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  time_in: string;
  confidence: number;
  image_path: string | null;
  is_duplicate: boolean;
  created_at: string;
  user?: {
    nim: string;
    name: string;
    kelas: string | null;
  };
}

export interface AttendanceSubmitRequest {
  image_base64: string;
}

export interface AttendanceStats {
  total_attendance: number;
  attendance_rate: number;
  present_today: boolean;
  current_streak: number;
  monthly_total: number;
}

export interface TodayAttendance {
  has_attended: boolean;
  attendance?: Attendance;
}

export interface AttendanceFilter {
  start_date?: string;
  end_date?: string;
  kelas?: string;
  user_id?: number;
  page?: number;
  limit?: number;
}
