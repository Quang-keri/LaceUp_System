export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "PAYOUT"
  | "COMMISSION"
  | "REFUND";

export type PaymentMethod =
  | "BANK_TRANSFER"
  | "CASH"
  | "CARD"
  | "E_WALLET"
  | "VN_PAY";

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export type TransactionCategory =
  | "BOOKING_DEPOSIT"
  | "BOOKING_FULL_PAYMENT"
  | "BOOKING_REMAINING_PAYMENT"
  | "EXTRA_SERVICE_PAYMENT"
  | "OWNER_PAYOUT"
  | "REFUND";

export interface TransactionResponse {
  id: string;

  type: TransactionType;

  amount: number;

  description: string;

  referenceId?: string;

  transactionDate: string;

  paymentMethod?: PaymentMethod;

  status?: TransactionStatus;

  category?: TransactionCategory;

  bookingId?: string;

  rentalAreaId?: string;

  rentalAreaName?: string;

  ownerId?: string;

  ownerName?: string;
}

export interface TransactionRequest {
  type: TransactionType;
  amount: number;
  description: string;
  referenceId?: string;

  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  category?: TransactionCategory;
  rentalAreaId?: string;
}

export interface PageResponse<T> {
  currentPage: number;

  totalPages: number;

  pageSize: number;

  totalElements: number;

  data: T[];
}

export interface TransactionSummaryResponse {
  totalIncome: number;
  totalExpense: number;
  systemTransferred: number;
  netProfit: number;
}
