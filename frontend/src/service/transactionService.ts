import type {
  TransactionResponse,
  TransactionRequest,
  PageResponse,
} from "../../src/types/transaction";
import api from "../config/axios";

export const getTransactions = async (params: any) => {
  const response = await api.get<any>("/transactions", {
    params,
  });
  return response.data.result as PageResponse<TransactionResponse>;
};

export const createTransaction = async (data: TransactionRequest) => {
  const response = await api.post<any>("/transactions", data);
  return response.data.result as TransactionResponse;
};

export const updateTransaction = async (
  id: string,
  data: TransactionRequest,
) => {
  const response = await api.put<any>(`/transactions/${id}`, data);
  return response.data.result as TransactionResponse;
};
