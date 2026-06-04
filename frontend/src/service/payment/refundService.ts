import api from "../../config/axios";

const refundService = {

  getPendingRefunds: (page: number, size: number) => {
    return api.get(`/admin/refunds/pending`, {
      params: { page, size },
    });
  },

  getCompletedRefunds: (page: number, size: number) => {
    return api.get(`/admin/refunds/completed`, {
      params: { page, size },
    });
  },

  confirmManualRefund: (paymentId: string) => {
    return api.post(`/admin/refunds/${paymentId}/confirm`);
  },
};

export default refundService;