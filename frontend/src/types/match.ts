import type { AddressResponse } from "./address.ts";
import type { UserResponse } from "./user.ts";

export interface MatchRequest {
  courtId: string | null;
  categoryId: number;
  street: string;
  ward: string;
  district: string;
  cityId: number;
  startTime: string;
  endTime: string;
  maxPlayers: number;
  minPlayersToStart: number;
  isRecurring: boolean;
  recurringType?: "DAILY" | "WEEKLY" | null;
  dayOfWeek?: string | null;
  endDate?: string | null;
  matchType: "NORMAL" | "BET" | "RANKED";
  winnerPercent?: number;
  minRank?: number;
  maxRank?: number;
  note?: string;
}

export interface MatchResponse {
  matchId: string;
  title: string;
  description: string;
  courtName: string;
  courtPrice: string;
  address: AddressResponse;
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
  matchType: "NORMAL" | "BET" | "RANKED";
  winnerPercent?: number;
  minRank?: number;
  maxRank?: number;
  isFull: boolean;
}
