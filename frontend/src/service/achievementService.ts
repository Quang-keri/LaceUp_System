import api from "../config/axios";
import type { UserAchievementResponse } from "../types/achivement.ts";
import type { ApiResponse } from "../types/ApiResponse";

const API_BASE_URL = "/achievements";

export const achievementService = {
  getMyAchievements: async (): Promise<
    ApiResponse<UserAchievementResponse[]>
  > => {
    const response = await api.get(`${API_BASE_URL}/me`);
    return response.data;
  },

  getUserAchievements: async (
    userId: string,
  ): Promise<ApiResponse<UserAchievementResponse[]>> => {
    const response = await api.get(`${API_BASE_URL}/${userId}`);
    return response.data;
  },
};

export default achievementService;
