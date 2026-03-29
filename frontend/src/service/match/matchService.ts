import api from "../../config/axios.ts";
import type { ApiResponse } from "../../types/ApiResponse.ts";
import type { MatchResponse, MatchRequest } from "../../types/match.ts";
import type { PageResponse } from "../../types/post.ts";

const API_BASE_URL = "/matches";

export const matchService = {
  createMatch: async (
    data: MatchRequest,
  ): Promise<ApiResponse<MatchResponse>> => {
    const response = await api.post(`${API_BASE_URL}/create`, data);
    return response.data;
  },

  joinMatch: async (matchId: string): Promise<ApiResponse<void>> => {
    const response = await api.post(`${API_BASE_URL}/${matchId}/join`);
    return response.data;
  },

  confirmDeposit: async (matchId: string): Promise<ApiResponse<string>> => {
    const response = await api.post(
      `${API_BASE_URL}/${matchId}/confirm-deposit`,
    );
    return response.data;
  },

  getOpenMatches: async (params: {
    page?: number;
    size?: number;
    category?: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
    matchType?: string;
  }): Promise<ApiResponse<PageResponse<MatchResponse>>> => {
    const response = await api.get(`${API_BASE_URL}/open`, {
      params,
    });

    return response.data;
  },

  getMatchDetail: async (
    matchId: string,
  ): Promise<ApiResponse<MatchResponse>> => {
    const response = await api.get(`${API_BASE_URL}/${matchId}`);
    return response.data;
  },

  getAllMatches: async (
    page: number,
    size: number,
    status?: string,
    category?: string,
    keyword?: string,
    startDate?: string,
    endDate?: string,
    matchType?: string,
  ): Promise<ApiResponse<PageResponse<MatchResponse>>> => {
    const params: any = { page, size };
    if (status) params.status = status;
    if (category && category !== "Tất cả") params.category = category;
    if (matchType && matchType !== "ALL") params.matchType = matchType;
    const response = await api.get(API_BASE_URL, { params });
    return response.data;
  },

  getOwnerMatches: async (
    page: number,
    size: number,
  ): Promise<ApiResponse<PageResponse<MatchResponse>>> => {
    const response = await api.get(`${API_BASE_URL}/owner`, {
      params: { page, size },
    });
    return response.data;
  },

  getMyMatches: async (
    page: number,
    size: number,
  ): Promise<ApiResponse<PageResponse<MatchResponse>>> => {
    const response = await api.get(`${API_BASE_URL}/my-matches`, {
      params: { page, size },
    });
    return response.data;
  },

  getUserMatchHistory: async (
    userId: string,
    page: number,
    size: number,
  ): Promise<ApiResponse<PageResponse<MatchResponse>>> => {
    const response = await api.get(`${API_BASE_URL}/user/${userId}/history`, {
      params: { page, size },
    });
    return response.data;
  },
};

export default matchService;
