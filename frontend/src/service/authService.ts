import api from '../config/axios';
import type {ApiResponse} from '../types/ApiResponse';
import type {
    LoginRequest,
    LoginResponse,
    LoginGoogleRequest,
    // CreateUserRequest
} from '../types/auth';

class AuthService {

    async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', request);
        localStorage.setItem('accessToken', response.data.result.accessToken);
        localStorage.setItem('refreshToken', response.data.result.refreshToken);
        return response.data;
    }

    async loginWithGoogle(code: string): Promise<ApiResponse<LoginResponse>> {
        const request: LoginGoogleRequest = {code};
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/google', request);
        return response.data;
    }

    async refreshToken(): Promise<ApiResponse<LoginResponse>> {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/refresh');
        return response.data;
    }

    async sendRegisterOtp(userRequest: any): Promise<ApiResponse<void>> {
        const response = await api.post<ApiResponse<void>>('/auth/register/request', userRequest);
        return response.data;
    }

    async confirmRegister(email: string, otp: string): Promise<ApiResponse<void>> {
        const response = await api.get<ApiResponse<void>>('/auth/register/confirm', {
            params: {email, otp}
        });
        return response.data;
    }

    async forgotPassword(email: string): Promise<ApiResponse<void>> {
        const response = await api.post<ApiResponse<void>>('/auth/forgot-password', null, {
            params: {email}
        });
        return response.data;
    }

    async resetPassword(request: any): Promise<ApiResponse<void>> {
        const response = await api.post<ApiResponse<void>>('/auth/reset-password', request);
        return response.data;
    }
}

export default new AuthService();