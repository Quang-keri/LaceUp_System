import api from "../../config/axios.ts";
import type { ApiResponse } from "../../types/ApiResponse.ts";
import type {
  MatchResultRequest,
  MatchResultResponse,
} from "../../types/matchResult.ts";

const API_BASE_URL = "/match-results";

export const matchResultService = {
  submitMatchResult: async (
    matchId: string,
    winningTeamNumber: number,
    absentUserIds: string[] = [],
  ): Promise<ApiResponse<MatchResultResponse>> => {
    const payload: MatchResultRequest = {
      matchId,
      winningTeamNumber,
      absentUserIds,
    };
    const response = await api.post(`${API_BASE_URL}/submit`, payload);
    return response.data;
  },

  respondToResult: async (
    resultId: string,
    isAccepted: boolean,
  ): Promise<ApiResponse<MatchResultResponse>> => {
    const response = await api.post(
      `${API_BASE_URL}/${resultId}/respond`,
      null,
      {
        params: { isAccepted },
      },
    );
    return response.data;
  },

  getResultsByMatch: async (
    matchId: string,
  ): Promise<ApiResponse<MatchResultResponse[]>> => {
    const response = await api.get(`${API_BASE_URL}/match/${matchId}`);
    return response.data;
  },
};

export default matchResultService;
