import api from "../../config/axios";
import type {
  RentalAreaResponse,
  CreateRentalAreaRequest,
  UpdateRentalAreaRequest,
  RentalAreaListResponse,
} from "../../types/rental";
import type { ApiResponse } from "../../types/ApiResponse";

class RentalService {
  async getRentalAreaById(rentalAreaId: string) {
    const response = await api.get<ApiResponse<RentalAreaResponse>>(
      `/rental-areas/${rentalAreaId}`,
    );
    return response.data;
  }

  async getMyRentalAreas(
    page: number = 1,
    size: number = 10,
    keyword?: string,
    status?: string,
  ) {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);

    const response = await api.get<ApiResponse<RentalAreaListResponse>>(
      `/rental-areas/my-rentals?${params.toString()}`,
    );
    return response.data;
  }

  async getAllRentalAreas(
    page: number = 1,
    size: number = 10,
    keyword?: string,
    cityId?: number,
    status?: string,
  ) {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (keyword) params.append("keyword", keyword);
    if (cityId) params.append("cityId", cityId.toString());
    if (status) params.append("status", status);

    const response = await api.get<ApiResponse<RentalAreaListResponse>>(
      `/rental-areas?${params.toString()}`,
    );
    return response.data;
  }

  async createRentalArea(request: CreateRentalAreaRequest, images: File[]) {
    const formData = new FormData();
    formData.append("rentalAreaName", request.rentalAreaName);
    formData.append("address", request.address);
    formData.append("contactName", request.contactName);
    formData.append("contactPhone", request.contactPhone);
    formData.append("cityId", request.cityId.toString());

    // Use userId from request (passed from component via useAuth context)
    if (request.userId) {
      formData.append("userId", request.userId);
    }

    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await api.post<ApiResponse<RentalAreaResponse>>(
      "/rental-areas",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  async updateRentalArea(
    rentalAreaId: string,
    request: UpdateRentalAreaRequest,
    images: File[],
  ) {
    const formData = new FormData();

    formData.append("rentalAreaName", request.rentalAreaName);
    formData.append("address", request.address);
    formData.append("contactName", request.contactName);
    formData.append("contactPhone", request.contactPhone);
    formData.append("cityId", request.cityId.toString());

    // Append ảnh vào request
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append("images", image); // Chữ "images" này phải khớp tên biến private List<MultipartFile> images
      });
    }

    const response = await api.put<ApiResponse<RentalAreaResponse>>(
      `/rental-areas/${rentalAreaId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  async deleteRentalArea(rentalAreaId: string) {
    const response = await api.delete<ApiResponse<void>>(
      `/rental-areas/${rentalAreaId}`,
    );
    return response.data;
  }
}

export default new RentalService();
