export type TransactionType = "INCOME" | "EXPENSE";

export type PaymentMethod = "BANK_TRANSFER" | "CASH" | "CARD" | "E_WALLET";

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  referenceId?: string;
  transactionDate: string;
  paymentMethod?: PaymentMethod;
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
