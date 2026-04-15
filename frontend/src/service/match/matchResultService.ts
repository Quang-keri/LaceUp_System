import api from "../../config/axios.ts";
import type { ApiResponse } from "../../types/ApiResponse.ts";

const API_BASE_URL = "/match-results";

export const matchResultService = {

  submitMatchResult: async (
    matchId: string,
    winningTeamNumber: number
  ): Promise<ApiResponse<any>> => {
    const payload = {
      matchId,
      winningTeamNumber,
    };
    const response = await api.post(`${API_BASE_URL}/submit`, payload);
    return response.data;
  },

  respondToResult: async (
    resultId: string,
    isAccepted: boolean
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(`${API_BASE_URL}/${resultId}/respond`, null, {
      params: { isAccepted },
    });
    return response.data;
  },

  getResultsByMatch: async (matchId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`${API_BASE_URL}/match/${matchId}`);
    return response.data;
  },
};

export default matchResultService;