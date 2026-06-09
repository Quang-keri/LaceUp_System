import api from "../config/axios";
import type {
  DeleteAccountRequest,
  DeleteAccountResponse,
} from "../types/accountDeletion";

interface ApiResponse<T> {
  code?: number;
  status?: number;
  message?: string;
  result: T;
}

const DELETE_ACCOUNT_ENDPOINT = "/users/me/account-deletion";

const accountDeletionService = {
  async requestAccountDeletion(
    payload: DeleteAccountRequest,
  ): Promise<DeleteAccountResponse> {
    const response = await api.post<ApiResponse<DeleteAccountResponse>>(
      DELETE_ACCOUNT_ENDPOINT,
      payload,
    );
    if (response.data?.result) {
      return response.data.result;
    }
    return response.data as unknown as DeleteAccountResponse;
  },
};

export default accountDeletionService;
