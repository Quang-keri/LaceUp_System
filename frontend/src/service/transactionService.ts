import type {
  TransactionResponse,
  TransactionRequest,
  PageResponse,
} from "../../src/types/transaction";
import api from "../config/axios";


export const getTransactions = async (params: any) => {
  const response = await api.get<PageResponse<TransactionResponse>>("/transactions", {
    params,
  });
  return response.data;
};

export const createTransaction = async (data: TransactionRequest) => {
  const response = await api.post<TransactionResponse>("/transactions", data);
  return response.data;
};

export const updateTransaction = async (
  id: string,
  data: TransactionRequest,
) => {
  const response = await api.put<TransactionResponse>(
    `/transactions/${id}`,
    data,
  );
  return response.data;
};


