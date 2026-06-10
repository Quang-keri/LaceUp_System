import api from "../../config/axios";
import type { RefundResponse } from "../../types/payment";
import type { ApiResponse } from "../../types/ApiResponse";

export interface ProcessRefundPayload {
  success: boolean;
  note?: string;
}

export interface RefundPageResponse {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  data: RefundResponse[];
}

class RefundService {
  async getPendingRefunds(page = 1, size = 10) {
    const response = await api.get<ApiResponse<RefundPageResponse>>(
      "/admin/refunds/pending",
      {
        params: {
          page,
          size,
        },
      },
    );

    return response.data;
  }

  async getCompletedRefunds(page = 1, size = 10) {
    const response = await api.get<ApiResponse<RefundPageResponse>>(
      "/admin/refunds/completed",
      {
        params: {
          page,
          size,
        },
      },
    );

    return response.data;
  }

  async processManualRefund(paymentId: string, payload: ProcessRefundPayload) {
    const response = await api.put<ApiResponse<void>>(
      `/admin/refunds/${paymentId}/process`,
      payload,
    );

    return response.data;
  }
}

export default new RefundService();
