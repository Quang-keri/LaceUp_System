import api from "../config/axios";
import type {
  CourtResponse,
  CreateCourtRequest,
  UpdateCourtRequest,
  CourtListResponse,
  CategoryResponse,
  CreateCourtCopyRequest,
  UpdateCourtCopyRequest,
  CourtCopyResponse,
} from "../types/court";
import type { ApiResponse } from "../types/ApiResponse";

class CourtService {
  async getMyCourts(page: number = 1, size: number = 10, keyword?: string) {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (keyword) params.append("keyword", keyword);

    const response = await api.get<ApiResponse<CourtListResponse>>(
      `/courts/my-courts?${params.toString()}`,
    );
    return response.data;
  }

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

  async createCourt(request: CreateCourtRequest, images: File[] = []) {
    const formData = new FormData();

    formData.append("courtName", request.courtName);
    formData.append("categoryId", String(request.categoryId));
    formData.append("pricePerHour", String(request.pricePerHour));
    formData.append("rentalAreaId", request.rentalAreaId);

    request.courtCodes.forEach((code) => {
      formData.append("courtCodes", code);
    });

    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await api.post<ApiResponse<CourtResponse>>(
      "/courts",
      formData,
    );

    return response.data;
  }

  async updateCourt(
    courtId: string,
    request: UpdateCourtRequest,
    images: File[] = [],
  ) {
    const formData = new FormData();
    if (request.courtName) formData.append("courtName", request.courtName);
    if (request.categoryId) formData.append("categoryId", request.categoryId);
    if (request.pricePerHour !== undefined)
      formData.append("pricePerHour", String(request.pricePerHour));

    // Append court codes if provided
    if (request.courtCodes && request.courtCodes.length > 0) {
      request.courtCodes.forEach((code, index) => {
        formData.append(`courtCodes[${index}]`, code);
      });
    }

    // Append images if provided
    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await api.put<ApiResponse<CourtResponse>>(
      `/courts/${courtId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
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

  // Court Copy APIs
  async createCourtCopy(request: CreateCourtCopyRequest) {
    const response = await api.post<ApiResponse<CourtCopyResponse>>(
      "/court_copies",
      request,
    );
    return response.data;
  }

  async updateCourtCopy(courtCopyId: string, request: UpdateCourtCopyRequest) {
    const response = await api.put<ApiResponse<CourtCopyResponse>>(
      `/court_copies/${courtCopyId}`,
      request,
    );
    return response.data;
  }

  async deleteCourtCopy(courtCopyId: string) {
    const response = await api.delete<ApiResponse<void>>(
      `/court_copies/${courtCopyId}`,
    );
    return response.data;
  }
}

export default new CourtService();
