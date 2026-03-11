export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface LoginGoogleRequest {
  code: string;
}