export interface PermissionRequest {
    permissionName: string;
    description?: string;
}

export interface PermissionResponse {
    permissionId: number;
    permissionName: string;
    description: string;
}