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
  phone: string;
  amount: number;
  paymentMethod: string;
  orderCode: string;
  transactionDate: string;
  source: "BOOKING" | "MATCH";
  referenceCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  qrCodeUrl: string;
}