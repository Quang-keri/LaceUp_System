import type { UserResponse } from "./user.ts";

export interface MatchRequest {
    courtId: string | null;
    categoryId: string;
    address: string;
    startTime: string;
    endTime: string;
    maxPlayers: number;
    minPlayersToStart: number;
    isRecurring: boolean;
    recurringType?: 'DAILY' | 'WEEKLY' | null;
    dayOfWeek?: string | null;
    endDate?: string | null;
    matchType: 'NORMAL' | 'BET' | 'RANKED';
    winnerPercent?: number;
    minRank?: number;
    maxRank?: number;
}

export interface MatchResponse {
    matchId: string;
    title: string;
    description: string;
    courtName: string;
    courtPrice: number;
    address: string;
    categoryName: string;
    startTime: string;
    endTime: string;
    maxPlayers: number;
    currentPlayers: number;
    remainingSlots: number;
    price: number;
    status: string;
    hostName: string;
    hostRating: number;
    level: string;
    hasCourt: boolean;
    participants: UserResponse[];
    isRecurring: boolean;
    recurringType: string;
    dayOfWeek: string;
    endDate: string;
        matchType: 'NORMAL' | 'BET' | 'RANKED';
    winnerPercent?: number;
    minRank?: number;
    maxRank?: number;
}