import api from '../config/axios';
import type { ApiResponse } from '../types/ApiResponse';
import type {
    LoginRequest,
    LoginResponse,
    LoginGoogleRequest,
    CreateUserRequest,
    ResetPasswordRequest
} from '../types/auth';

class AuthService {
    private setTokens(result: LoginResponse) {
        localStorage.setItem('accessToken', result.accessToken);
        localStorage.setItem('refreshToken', result.refreshToken);
    }

    async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', request);
        if (response.data.result) {
            this.setTokens(response.data.result);
        }
        return response.data;
    }

    async loginWithGoogle(code: string): Promise<ApiResponse<LoginResponse>> {
        const request: LoginGoogleRequest = { code };
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/google', request);
        if (response.data.result) {
            this.setTokens(response.data.result);
        }
        return response.data;
    }

    async refreshToken(): Promise<ApiResponse<LoginResponse>> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/refresh');
        if (response.data.result) {
            this.setTokens(response.data.result);
        }
        return response.data;
    }

    async sendRegisterOtp(userRequest: CreateUserRequest): Promise<ApiResponse<void>> {
        const response = await api.post<ApiResponse<void>>('/auth/register/request', userRequest);
        return response.data;
    }

    async confirmRegister(email: string, otp: string): Promise<ApiResponse<void>> {
        const response = await api.get<ApiResponse<void>>('/auth/register/confirm', {
            params: { email, otp }
        });
        return response.data;
    }

    async forgotPassword(email: string): Promise<ApiResponse<void>> {
        const response = await api.post<ApiResponse<void>>('/auth/forgot-password', null, {
            params: { email }
        });
        return response.data;
    }

    async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<void>> {
        const response = await api.post<ApiResponse<void>>('/auth/reset-password', request);
        return response.data;
    }
}

export default new AuthService();