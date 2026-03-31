import api from "../config/axios.ts";
import type { ApiResponse } from "../types/ApiResponse";

const API_BASE_URL = "/chatbot";

export const chatBotService = {
  asking: async (message: string): Promise<ApiResponse<string>> => {
    const response = await api.post(`${API_BASE_URL}/ask`, { message });
    return response.data;
  },
};

export default chatBotService;
