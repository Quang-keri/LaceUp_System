import api from '../config/axios.ts';
import type { ApiResponse } from "../types/ApiResponse.ts";
import type {
    PermissionRequest,
    PermissionResponse
} from '../types/permission';

const API_BASE_URL = '/permissions';

export const permissionService = {

    // Lấy tất cả quyền hạn
    getAllPermissions: async (): Promise<ApiResponse<PermissionResponse[]>> => {
        const response = await api.get(API_BASE_URL);
        return response.data;
    },

    // Lấy chi tiết một quyền theo ID
    getPermissionById: async (permissionId: number): Promise<ApiResponse<PermissionResponse>> => {
        const response = await api.get(`${API_BASE_URL}/${permissionId}`);
        return response.data;
    },

    // Tạo quyền mới
    createPermission: async (data: PermissionRequest): Promise<ApiResponse<PermissionResponse>> => {
        const response = await api.post(API_BASE_URL, data);
        return response.data;
    },

    // Cập nhật quyền
    updatePermission: async (permissionId: number, data: PermissionRequest): Promise<ApiResponse<PermissionResponse>> => {
        const response = await api.put(`${API_BASE_URL}/${permissionId}`, data);
        return response.data;
    },

    // Xóa quyền
    deletePermission: async (permissionId: number): Promise<ApiResponse<void>> => {
        const response = await api.delete(`${API_BASE_URL}/${permissionId}`);
        return response.data;
    }
};

export default permissionService;