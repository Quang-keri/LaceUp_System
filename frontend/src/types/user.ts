import type { BankAccount } from "./bankAccount.ts";
import type { PermissionResponse } from "./permission.ts";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface UserResponse {
  userId: string;
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
  isDepositConfirmed?: boolean;
  teamNumber?: number | null;
  categoryRanks?: CategoryRankResponse[];
  creditScore?: number;
  memberTier?: string;
  totalMatches?: number;
  totalSpent?: number;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  bankAccount?: BankAccount;
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
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

export interface CategoryRankResponse {
  categoryId: number;
  categoryName: string;
  rankPoint: number;
  displayRank: string;
  totalMatches: number;
  totalWins: number;
  currentWinStreak: number;
  winRate: number;
}

export interface UserDashboardResponse {
  userId: string;
  userName: string;
  avatarUrl?: string;

  totalMatches: number;
  totalWins: number;
  winRate: number;
  reputationScore: number;

  categoryRanks: CategoryRankResponse[];
}

export interface ReputationLogResponse {
  id: number;
  pointsChanged: number;
  reason: string;
  createdAt: string;
}