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
    rankPoint?: number;
    fakeMoney?: number;
    displayRank?: string;
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

export interface UserDashboardResponse {
    userId: string;
    userName: string;
    avatarUrl?: string;
    rankPoint: number;
    displayRank: string;
    totalMatches: number;
    totalWins: number;
    currentWinStreak: number;
    maxWinStreak: number;
    winRate: number;
}