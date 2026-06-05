import type { AddressResponse } from "./address.ts";
import type { UserResponse } from "./user.ts";

export interface MatchRequest {
  courtId: string | null;
  categoryId: number;
  startTime: string;
  endTime: string;
  maxPlayers: number;
  minPlayersToStart: number;
  isRecurring: boolean;
  recurringType?: "DAILY" | "WEEKLY" | null;
  dayOfWeek?: string | null;
  endDate?: string | null;
  matchType: "NORMAL" | "BET" | "RANKED";
  minRank?: number;
  maxRank?: number;
  note?: string;
}

export interface MatchResponse {
  matchId: string;
  roomCode?: string;
  title: string;
  description: string;
  courtName: string;
  courtPrice: number;
  address: AddressResponse;
  categoryName: string;
  startTime: string;
  endTime: string;
  maxPlayers: number;
  currentPlayers: number;
  remainingSlots: number;
  price: number;
  status: string;
  host: UserResponse;
  level: string;
  hasCourt: boolean;
  participants: UserResponse[];
  isRecurring: boolean;
  recurringType: string;
  dayOfWeek: string;
  endDate: string;
  matchType: "NORMAL" | "BET" | "RANKED";
  note?: string;
  minRank?: number;
  maxRank?: number;
  isFull: boolean;
  reports?: MatchReportResponse[];
}

export interface ReportRequest {
  matchId: string;
  reportedUserIds?: string[];
  reasonType: "BAD_BEHAVIOR" | "ABSENT" | "LATE" | "OTHER" | "EARLY_ABSENT";
  description: string;
  evidenceImages?: string[];
}

export interface MatchReportResponse {
  reportId: string;
  reporterName: string;
  reasonType: string;
  description: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
}
