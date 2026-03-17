import type {UserResponse} from "./user.ts";

export interface MatchRequest {
    courtId: string;
    startTime: string;
    endTime: string;
    maxPlayers: number;
    minPlayersToStart: number;
    isRecurring: boolean;
}

export interface MatchResponse {
    matchId: string;
    title: string;
    description: string;
    courtName: string;
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
    participants: UserResponse[];
}