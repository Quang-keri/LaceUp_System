import api from '../config/axios.ts';
import type { ApiResponse } from "../types/ApiResponse.ts";
import type { RoleRequest, RoleResponse } from '../types/role';

const API_BASE_URL = '/roles';

export const roleService = {

    // --- CRUD APIs ---

    getAllRoles: async (): Promise<ApiResponse<RoleResponse[]>> => {
        const response = await api.get(API_BASE_URL);
        return response.data;
    },

    getRoleById: async (roleId: number): Promise<ApiResponse<RoleResponse>> => {
        const response = await api.get(`${API_BASE_URL}/${roleId}`);
        return response.data;
    },

    createRole: async (data: RoleRequest): Promise<ApiResponse<RoleResponse>> => {
        const response = await api.post(API_BASE_URL, data);
        return response.data;
    },

    updateRole: async (roleId: number, data: RoleRequest): Promise<ApiResponse<RoleResponse>> => {
        const response = await api.put(`${API_BASE_URL}/${roleId}`, data);
        return response.data;
    },

    updateStatus: async (roleId: number, newStatus: boolean): Promise<ApiResponse<void>> => {
        return api.patch(`${API_BASE_URL}/${roleId}/status`, {
            active: newStatus,
        });
    },

    updateRolePermissions: async (roleId: number, permissionIds: number[]): Promise<ApiResponse<RoleResponse>> => {
        const response = await api.put(`${API_BASE_URL}/${roleId}/permissions`, permissionIds);
        return response.data;
    },

};

export default roleService;