export type TransactionType = "INCOME" | "EXPENSE";

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  referenceId?: string;
  transactionDate: string;
}

export interface TransactionRequest {
  type: TransactionType;
  amount: number;
  description: string;
  referenceId?: string;
}

export interface PageResponse<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: T[];
}
