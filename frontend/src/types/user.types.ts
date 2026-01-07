// User Types
export interface User {
  id: number;
  nim: string;
  name: string;
  email: string | null;
  role: 'user' | 'admin' | 'teacher';
  kelas: string | null;
  is_active: boolean;
  has_face: boolean;
  created_at: string;
  updated_at?: string;
  last_login: string | null;
}

export interface UserWithStats extends User {
  total_attendance: number;
  attendance_rate: number;
  current_streak: number;
  encodings_count: number;
}

export interface UserCreate {
  nim: string;
  name: string;
  email?: string;
  password: string;
  kelas?: string;
  role?: 'user' | 'admin' | 'teacher';
}

export interface UserUpdate {
  name?: string;
  email?: string;
  kelas?: string;
  password?: string;
  is_active?: boolean;
}
