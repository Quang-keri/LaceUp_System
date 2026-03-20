export type BookingStatusType = 'BOOKED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatusType = 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export interface MonthlyRevenueData {
    month: string;
    revenue: number;
}

export interface DashboardData {
    bookingStats: Record<BookingStatusType, number>;
    paymentStats: Record<PaymentStatusType, number>;
    totalRevenue: number;
    monthlyRevenue: MonthlyRevenueData[]; 
}