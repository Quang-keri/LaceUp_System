import api from "../config/axios";
import type { DeleteAccountResponse } from "../types/accountDeletion";

interface ApiResponse<T> {
  code?: number;
  status?: number;
  message?: string;
  result?: T;
}

const DELETE_ACCOUNT_ENDPOINT = "/users/me/account-deletion";

const accountDeletionService = {
  async requestAccountDeletion(): Promise<DeleteAccountResponse> {
    const response = await api.post<ApiResponse<DeleteAccountResponse>>(
      DELETE_ACCOUNT_ENDPOINT,
    );

    const responseData = response.data;

    if (responseData?.result) {
      return responseData.result;
    }

    return responseData as unknown as DeleteAccountResponse;
  },
};

export default accountDeletionService;
