export type RefundStatus = "REFUND_PENDING" | "REFUND_FAILED" | "REFUNDED";

export type RefundSource = "BOOKING" | "MATCH" | "SHARED_TICKET";

export type RefundResponsible = "ADMIN" | "OWNER";

export type MoneyFlow = "ADMIN_COLLECTED" | "OWNER_COLLECTED";

export interface PaymentResponse {
  paymentId: string;
  transactionDate: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentType: string;
  userId: string | null;
  bookingId: string | null;
  channel: string | null;
  transactionCode: string | null;
  orderCode: number | null;
  payosPaymentLinkId: string | null;
}

export interface RefundResponse {
  paymentId: string;

  userName: string;
  phone?: string | null;
  email?: string | null;

  amount: number;
  paymentMethod?: string | null;
  orderCode?: string | null;
  transactionDate?: string | null;

  source: RefundSource;
  referenceCode?: string | null;

  bankName?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  qrCodeUrl?: string | null;

  refundStatus: RefundStatus;
  refundNote?: string | null;
  refundProcessedAt?: string | null;

  rentalAreaId?: string | null;
  rentalAreaName?: string | null;

  ownerId?: string | null;
  ownerName?: string | null;

  refundResponsible?: RefundResponsible | null;
  moneyFlow?: MoneyFlow | null;
}

export interface RefundPageResponse {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  data: RefundResponse[];
}

export interface ProcessRefundPayload {
  success: boolean;
  note?: string;
}
