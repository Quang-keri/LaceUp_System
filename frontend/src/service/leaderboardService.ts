import api from "../config/axios";
import type { ApiResponse } from "../types/ApiResponse";

const API_BASE_URL = "/leaderboards";

export const leaderboardService = {
  getTop100ByCategory: async (
    categoryId: number,
  ): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`${API_BASE_URL}/${categoryId}/top100`);
    return response.data;
  },

  getMyLeaderboardStats: async (
    categoryId: number,
  ): Promise<ApiResponse<any>> => {
    const response = await api.get(`${API_BASE_URL}/${categoryId}/me`);
    return response.data;
  },
};

export default leaderboardService;
