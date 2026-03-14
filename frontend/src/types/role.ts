import type {PermissionResponse} from "./permission.ts";

export interface RoleRequest {
    roleName: string;
    description?: string;
}

export interface RoleResponse {
    roleId: number;
    roleName: string;
    description: string;
    active: boolean;
    permissions: PermissionResponse[];
}

export interface UpdateRoleStatusRequest {
    active: boolean;
}