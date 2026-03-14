import api from "../config/axios";
import type {
  CourtResponse,
  CreateCourtRequest,
  UpdateCourtRequest,
  CourtListResponse,
  CategoryResponse,
} from "../types/court";
import type { ApiResponse } from "../types/ApiResponse";

class CourtService {
  async getCourtsByRentalArea(
    rentalAreaId: string,
    page: number = 1,
    size: number = 10,
    keyword?: string,
  ) {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (keyword) params.append("keyword", keyword);

    const response = await api.get<ApiResponse<CourtListResponse>>(
      `/courts/rental-area/${rentalAreaId}?${params.toString()}`,
    );
    return response.data;
  }

  async getCourtById(courtId: string) {
    const response = await api.get<ApiResponse<CourtResponse>>(
      `/courts/${courtId}`,
    );
    return response.data;
  }

  async createCourt(request: CreateCourtRequest) {
    const requestBody = {
      courtName: request.courtName,
      categoryId: request.categoryId,
      pricePerHour: request.price,
      rentalAreaId: request.rentalAreaId,
      courtCodes: request.courtCodes,
    };

    const response = await api.post<ApiResponse<CourtResponse>>(
      "/courts",
      requestBody,
    );
    return response.data;
  }

  async updateCourt(courtId: string, request: UpdateCourtRequest) {
    const requestBody = {
      courtName: request.courtName,
      categoryId: request.categoryId,
      pricePerHour: request.price,
      courtCodes: request.courtCodes,
    };

    const response = await api.put<ApiResponse<CourtResponse>>(
      `/courts/${courtId}`,
      requestBody,
    );
    return response.data;
  }

  async deleteCourt(courtId: string) {
    const response = await api.delete<ApiResponse<void>>(`/courts/${courtId}`);
    return response.data;
  }

  async getCategories() {
    const response =
      await api.get<ApiResponse<CategoryResponse[]>>("/categories");
    return response.data;
  }
}

export default new CourtService();
