import api from "../../config/axios";

const adminReviewService = {
  getStats: () => api.get(`/admin/reviews/stats`),

  list: (params: Record<string, any>) => {
    return api.get(`/admin/reviews`, {
      params: {
        ...params,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    });
  },
};

export default adminReviewService;
