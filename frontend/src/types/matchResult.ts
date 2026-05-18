export interface MatchResultRequest {
  matchId: string;
  winningTeamNumber: number;
  absentUserIds?: string[];
}

export interface MatchResultResponse {
  resultId: string;
  matchId: string;
  submitterId: string;
  winningTeamNumber: number;
  winnerIds: string[];
  loserIds: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  absentUserIds: string[];
  rankChanges?: Record<string, number>; 
}