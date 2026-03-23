import api from "../config/axios";
import type { ApiResponse } from "../types/ApiResponse";
import type { PageResponse } from "../types/PageResponse";
import type {
  CategoryResponse,
  CategoryRequest,
  UpdateCategoryRequest,
} from "../types/category";

class CategoryService {
  async getAllCategories(
    page: number = 1,
    size: number = 10,
    keyword?: string,
    from?: string,
    to?: string,
  ) {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    if (keyword) params.append("keyword", keyword);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await api.get<ApiResponse<PageResponse<CategoryResponse>>>(
      `/categories?${params.toString()}`,
    );
    return response.data;
  }

  async getCategoryById(categoryId: string) {
    const response = await api.get<ApiResponse<CategoryResponse>>(
      `/categories/${categoryId}`,
    );
    return response.data;
  }

  async createCategory(request: CategoryRequest) {
    const response = await api.post<ApiResponse<CategoryResponse>>(
      "/categories",
      request,
    );
    return response.data;
  }

  async updateCategory(categoryId: string, request: UpdateCategoryRequest) {
    const response = await api.put<ApiResponse<CategoryResponse>>(
      `/categories/${categoryId}`,
      request,
    );
    return response.data;
  }

  async deleteCategory(categoryId: string) {
    const response = await api.delete<ApiResponse<void>>(
      `/categories/${categoryId}`,
    );
    return response.data;
  }
}

export default new CategoryService();
