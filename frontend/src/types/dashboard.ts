export type BookingStatusType = 'BOOKED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatusType = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface DashboardData {
    bookingStats: Record<BookingStatusType, number>;
    paymentStats: Record<PaymentStatusType, number>;
    totalRevenue: number;
}