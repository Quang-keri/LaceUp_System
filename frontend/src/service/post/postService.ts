import api from "../../config/axios";
import type { ApiResponse } from "../../types/ApiResponse";
import type { PageResponse, PostResponse } from "../../types/post";

class PostService {
  async getPosts(page = 1, size = 10) {
    const response = await api.get<ApiResponse<PageResponse<PostResponse>>>(
      "/posts",
      {
        params: { page, size },
      },
    );

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
