import api from "../../config/axios";
import type { ApiResponse } from "../../types/ApiResponse";
import type {
  ProcessRefundPayload,
  RefundPageResponse,
} from "../../types/payment";

class OwnerRefundService {
  async getPendingRefunds(
    rentalAreaId?: string,
    page = 1,
    size = 10,
  ) {
    const response = await api.get<
      ApiResponse<RefundPageResponse>
    >("/owner/refunds/pending", {
      params: {
        page,
        size,
        ...(rentalAreaId
          ? { rentalAreaId }
          : {}),
      },
    });

    return response.data;
  }

  async getCompletedRefunds(
    rentalAreaId?: string,
    page = 1,
    size = 10,
  ) {
    const response = await api.get<
      ApiResponse<RefundPageResponse>
    >("/owner/refunds/completed", {
      params: {
        page,
        size,
        ...(rentalAreaId
          ? { rentalAreaId }
          : {}),
      },
    });

    return response.data;
  }

  async processRefund(
    paymentId: string,
    payload: ProcessRefundPayload,
  ) {
    const response = await api.put<
      ApiResponse<void>
    >(
      `/owner/refunds/${paymentId}/process`,
      payload,
    );

    return response.data;
  }
}

export default new OwnerRefundService();
