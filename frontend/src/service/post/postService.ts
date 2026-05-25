import api from "../../config/axios";
import type { ApiResponse } from "../../types/ApiResponse";
import type { PostResponse } from "../../types/post";

class PostService {
  async getPosts(filters: any) {

    const params: any = { ...filters };

    if (params.cityIds?.length) params.cityIds = params.cityIds.join(",");
    if (params.categoryIds?.length)
      params.categoryIds = params.categoryIds.join(",");
    if (params.amenityIds?.length)
      params.amenityIds = params.amenityIds.join(",");

    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });

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
