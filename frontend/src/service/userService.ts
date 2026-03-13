import axios from 'axios';
import type {ApiResponse} from "../types/ApiResponse.ts";
import type {
    UserResponse,
    CreateUserRequest,
    UpdateUserRequest
} from '../types/user';

const API_BASE_URL = 'http://localhost:8080/api/v1/users';

const userService = {

    // --- GET ME API ---
    getMyInfo: async (): Promise<ApiResponse<UserResponse>> => {
        const response = await axios.get(`${API_BASE_URL}/my-info`);
        return response.data;
    },

    // --- CRUD APIs ---
    createUser: async (data: CreateUserRequest): Promise<ApiResponse<UserResponse>> => {
        const response = await axios.post(API_BASE_URL, data);
        return response.data;
    },

    getAllUsers: async (): Promise<ApiResponse<UserResponse[]>> => {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    },

    getUserById: async (userId: string): Promise<ApiResponse<UserResponse>> => {
        const response = await axios.get(`${API_BASE_URL}/${userId}`);
        return response.data;
    },

    updateUser: async (userId: string, data: UpdateUserRequest): Promise<ApiResponse<UserResponse>> => {
        const response = await axios.put(`${API_BASE_URL}/${userId}`, data);
        return response.data;
    },

    deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
        const response = await axios.delete(`${API_BASE_URL}/${userId}`);
        return response.data;
    },

    // --- RBAC APIs (Role-Based Access Control) ---
    assignRoleToUser: async (userId: string, roleId: number): Promise<ApiResponse<UserResponse>> => {
        const response = await axios.put(`${API_BASE_URL}/${userId}/role/${roleId}`);
        return response.data;
    },

    addExtraPermissions: async (userId: string, permissionIds: number[]): Promise<ApiResponse<UserResponse>> => {
        const response = await axios.post(`${API_BASE_URL}/${userId}/extra-permissions`, permissionIds);
        return response.data;
    },

    removeExtraPermissions: async (userId: string, permissionIds: number[]): Promise<ApiResponse<UserResponse>> => {
        // Lưu ý: Với Delete có body, một số thư viện yêu cầu bọc trong { data: ... }
        const response = await axios.delete(`${API_BASE_URL}/${userId}/extra-permissions`, { data: permissionIds });
        return response.data;
    },

    getUserAuthorities: async (userId: string): Promise<ApiResponse<string[]>> => {
        const response = await axios.get(`${API_BASE_URL}/${userId}/authorities`);
        return response.data;
    }
};

export default userService;