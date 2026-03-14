import type {PermissionResponse} from "./permission.ts";

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface UserResponse {
    userId: string; // UUID
    userName: string;
    email: string;
    gender: Gender;
    phone: string;
    dateOfBirth: string;
    age: number;
    role: string;
    createdAt: string;
    updatedAt: string;
    active: boolean;
    permissions?: string[];
    extraPermissions?: PermissionResponse[];
}

export interface CreateUserRequest {
    userName: string;
    gender?: Gender;
    email: string;
    password?: string;
    phone?: string;
    dateOfBirth: string;
    roleName: string;
    otp?: string;
}

export interface UpdateUserRequest {
    userName?: string;
    phone?: string;
    gender?: Gender;
    dateOfBirth?: string;
}