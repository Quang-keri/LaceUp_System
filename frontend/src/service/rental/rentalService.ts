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

  async createRentalArea(values: any) {
    const formData = new FormData();

    formData.append("userId", values.userId);
    formData.append("rentalAreaName", values.rentalAreaName);
    formData.append("street", values.street);
    formData.append("ward", values.ward);
    formData.append("district", values.district);

    formData.append("cityName", values.cityName);
    formData.append("contactName", values.contactName);
    formData.append("contactPhone", values.contactPhone);
    formData.append("gmail", values.gmail || "");
    if (values.latitude) formData.append("latitude", String(values.latitude));
    if (values.longitude)
      formData.append("longitude", String(values.longitude));
    formData.append("openTime", values.openTime);
    formData.append("closeTime", values.closeTime);
    formData.append("facebookLink", values.facebookLink || "");
    if (values.images && Array.isArray(values.images)) {
      values.images.forEach((file: any) => {
        const fileObj = file.originFileObj || file;
        if (fileObj instanceof File || fileObj instanceof Blob) {
          formData.append("images", fileObj);
        }
      });
    }

    const response = await api.post("/rental-areas", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async updateRentalArea(
    rentalAreaId: string,
    request: UpdateRentalAreaRequest,
    images?: File[],
  ) {
    const formData = new FormData();

    formData.append("rentalAreaName", request.rentalAreaName || "");
    formData.append("street", request.address?.street || "");
    formData.append("ward", request.address?.ward || "");
    formData.append("district", request.address?.district || "");
    formData.append("contactName", request.contactName || "");
    formData.append("contactPhone", request.contactPhone || "");
    formData.append("cityId", request.cityId ? request.cityId.toString() : "");

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
