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

export interface LoginGoogleResponse {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface CreateUserRequest {
  userName: string;
  gender: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  roleName: string;
  otp?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}