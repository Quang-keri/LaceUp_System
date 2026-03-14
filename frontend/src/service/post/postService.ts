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
}

export default new PostService();
