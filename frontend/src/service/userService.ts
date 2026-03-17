import api from '../config/axios.ts';
import type { ApiResponse } from "../types/ApiResponse.ts";
import type {
    UserResponse,
    CreateUserRequest,
    UpdateUserRequest
} from '../types/user';

const API_BASE_URL = '/users';

export const userService = {

    getMyInfo: async (): Promise<ApiResponse<UserResponse>> => {
        const response = await api.get(`${API_BASE_URL}/my-info`);
        return response.data;
    },

    createUser: async (data: CreateUserRequest): Promise<ApiResponse<UserResponse>> => {
        const response = await api.post(API_BASE_URL, data);
        return response.data;
    },

    getAllUsers: (
        page: number,
        size: number,
        role?: string,
        active?: boolean,
        keyword?: string,
    ) => {
        const params: any = { page, size };

        if (role) params.role = role;
        if (active !== undefined) params.active = active;
        if (keyword) params.keyword = keyword;
        return api.get("/users", { params });
    },

    getUserById: async (userId: string): Promise<ApiResponse<UserResponse>> => {
        const response = await api.get(`${API_BASE_URL}/${userId}`);
        return response.data;
    },

    updateUser: async (userId: string, data: UpdateUserRequest): Promise<ApiResponse<UserResponse>> => {
        const response = await api.put(`${API_BASE_URL}/${userId}`, data);
        return response.data;
    },

    updateStatus: (userId: string, newStatus: boolean) => {
        return api.patch<any, ApiResponse<void>>(`/users/${userId}`, {
            status: newStatus,
        });
    },

    assignRoleToUser: async (userId: string, roleId: number): Promise<ApiResponse<UserResponse>> => {
        const response = await api.put(`${API_BASE_URL}/${userId}/role/${roleId}`);
        return response.data;
    },

    addExtraPermissions: async (userId: string, permissionIds: number[]): Promise<ApiResponse<UserResponse>> => {
        const response = await api.post(`${API_BASE_URL}/${userId}/extra-permissions`, permissionIds);
        return response.data;
    },

    removeExtraPermissions: async (userId: string, permissionIds: number[]): Promise<ApiResponse<UserResponse>> => {
        // Với Delete có body, instance 'api' đã được cấu hình để xử lý
        const response = await api.delete(`${API_BASE_URL}/${userId}/extra-permissions`, { data: permissionIds });
        return response.data;
    },

    getUserAuthorities: async (userId: string): Promise<ApiResponse<string[]>> => {
        const response = await api.get(`${API_BASE_URL}/${userId}/authorities`);
        return response.data;
    }
};

export default userService;