import api from "../config/axios";
import type { ApiResponse } from "../types/ApiResponse";

export interface CourtPriceRequest {
   courtId: string;
  startTime?: string;
  endTime?: string;
  pricePerHour?: number;
  specificDate?: string;
  priceType?: string;
  priority?: number;
}

export interface CourtPriceResponse {
  courtPriceId: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  specificDate?: string;
  priceType: string;
  priority: number;
}

class CourtPriceService {
  async createCourtPrice(data: CourtPriceRequest) {
    const res = await api.post("/courts/prices", data);
    return res.data;
  }

  async updateCourtPrice(id: string, request: CourtPriceRequest) {
    const res = await api.put<ApiResponse<CourtPriceResponse>>(
      `/courts/prices/${id}`,
      request,
    );
    return res.data;
  }

  async getByCourt(courtId: string) {
    const res = await api.get<ApiResponse<CourtPriceResponse[]>>(
      `/courts/prices/${courtId}`,
    );
    return res.data;
  }

  async deleteCourtPrice(courtId: string) {
    const res = await api.delete(`/courts/prices/${courtId}`);
    return res.data;
  }
}

export default new CourtPriceService();
