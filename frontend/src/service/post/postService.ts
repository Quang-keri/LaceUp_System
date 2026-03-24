import api from "../../config/axios";
import type { ApiResponse } from "../../types/ApiResponse";
import type { PageResponse, PostResponse } from "../../types/post";
// Nhớ import FilterState từ đúng đường dẫn nhé, ví dụ:
// import type { FilterState } from "../../pages/PostPage";

class PostService {
  async getPosts(filters: any) {
    // Hoặc thay 'any' bằng 'FilterState' nếu bạn đã import
    // Ép kiểu các array thành string (vd: [1,2] -> "1,2") để Spring Boot dễ đọc
    const params: any = { ...filters };

    if (params.cityIds?.length) params.cityIds = params.cityIds.join(",");
    if (params.categoryIds?.length)
      params.categoryIds = params.categoryIds.join(",");
    if (params.amenityIds?.length)
      params.amenityIds = params.amenityIds.join(",");

    // Xóa các key bị undefined để URL gọn đẹp hơn
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });

    // Gọi API thông qua 'api' instance đã config, đồng bộ endpoint là "/posts"
    const response = await api.get("/posts", { params });
    return response.data;
  }

  async getMyPosts(status?: string) {
    const response = await api.get<ApiResponse<PostResponse[]>>("/posts/me", {
      params: { status },
    });
    return response.data;
  }

  async getMyPostDetail(postId: string) {
    const response = await api.get<ApiResponse<any>>(`/posts/me/${postId}`);
    return response.data;
  }

  async createPost(request: {
    title: string;
    description: string;
    courtId: string;
  }) {
    const response = await api.post<ApiResponse<any>>("/posts", request);
    return response.data;
  }

  async updatePost(
    postId: string,
    request: { title?: string; description?: string; postStatus?: string },
  ) {
    const response = await api.put<ApiResponse<any>>(
      `/posts/${postId}`,
      request,
    );
    return response.data;
  }

  async deletePost(postId: string) {
    const response = await api.delete<ApiResponse<any>>(`/posts/${postId}`);
    return response.data;
  }
}

export default new PostService();
