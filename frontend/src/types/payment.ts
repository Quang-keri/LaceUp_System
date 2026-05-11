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