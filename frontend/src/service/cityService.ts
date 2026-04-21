import api from "../config/axios";
import type { ApiResponse } from "../types/ApiResponse";

export interface CityResponse {
  id: number;
  name: string;
}

class CityService {
  async getAll(): Promise<ApiResponse<CityResponse[]>> {
    const res = await api.get("/cities");
    return res.data;
  }

  async getById(id: number): Promise<ApiResponse<CityResponse>> {
    const res = await api.get(`/cities/${id}`);
    return res.data;
  }
}

export default new CityService();
