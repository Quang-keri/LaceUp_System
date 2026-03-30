import api from "../config/axios";
import type { ApiResponse } from "../types/ApiResponse";

export interface AmenityResponse {
  amenityId: number;
  amenityName: string;
  iconKey: string;
}

/*

AmenityResponse
export interface CityResponse {
  id: number;
  name: string;
}

*/
class AmenityService {
  async getAllAmenities(): Promise<ApiResponse<AmenityResponse[]>> {
    const res = await api.get("/amenities");
    return res.data;
  }

  async getAmenityById(id: number): Promise<ApiResponse<AmenityResponse>> {
    const res = await api.get(`/amenities/${id}`);
    return res.data;
  }
}

export default new AmenityService();
