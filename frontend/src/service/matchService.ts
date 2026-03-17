import api from '../config/axios.ts';
import type { ApiResponse } from "../types/ApiResponse.ts";
import type { MatchResponse, MatchRequest } from '../types/match';
import type {PageResponse} from "../types/post.ts";

const API_BASE_URL = '/matches';

export const matchService = {
    createMatch: async (data: MatchRequest): Promise<ApiResponse<MatchResponse>> => {
        const response = await api.post(`${API_BASE_URL}/create`, data);
        return response.data;
    },

    joinMatch: async (matchId: string): Promise<ApiResponse<void>> => {
        const response = await api.post(`${API_BASE_URL}/${matchId}/join`);
        return response.data;
    },

    getOpenMatches: async (): Promise<ApiResponse<MatchResponse[]>> => {
        const response = await api.get(`${API_BASE_URL}/open`);
        return response.data;
    },

    getMatchDetail: async (matchId: string): Promise<ApiResponse<MatchResponse>> => {
        const response = await api.get(`${API_BASE_URL}/${matchId}`);
        return response.data;
    },

    filterMatches: (
        page: number,
        size: number,
        category?: string,
        level?: string,
        keyword?: string
    ) => {
        const params: any = { page, size };
        if (category) params.category = category;
        if (level) params.level = level;
        if (keyword) params.keyword = keyword;

        return api.get(`${API_BASE_URL}/filter`, { params });
    },

    getAllMatches: async (
        page: number,
        size: number,
        status?: string,
        category?: string,
        keyword?: string,
        startDate?: string,
        endDate?: string
    ): Promise<ApiResponse<PageResponse<MatchResponse>>> => {
        const params: any = { page, size };

        if (status) params.status = status;
        if (category) params.category = category;
        if (keyword) params.keyword = keyword;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get(API_BASE_URL, { params });
        return response.data;
    },

    getOwnerMatches: async (page: number, size: number): Promise<ApiResponse<PageResponse<MatchResponse>>> => {
        const response = await api.get(`${API_BASE_URL}/owner`, {
            params: { page, size }
        });
        return response.data;
    },
};

export default matchService;