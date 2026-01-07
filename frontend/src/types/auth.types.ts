// Auth Types
export interface LoginRequest {
  nim: string;
  password: string;
}

export interface RegisterRequest {
  nim: string;
  name: string;
  email?: string;
  password: string;
  kelas?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  user: import('./user.types').User;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}
