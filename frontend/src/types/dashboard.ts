  export type BookingStatusType = "BOOKED" | "COMPLETED" | "CANCELLED";
  export type PaymentStatusType = "PENDING" | "SUCCESS" | "BOOKED" | "COMPLETED" | "CANCELLED" | "FAILED";

  export interface PeriodStatsData {
    date?: string;
    month?: string;
    revenue: number;
    bookingCount: number;
  }

  export interface DashboardData {
    bookingStats: Record<BookingStatusType, number>;
    paymentStats: Record<PaymentStatusType, number>;
    totalRevenue: number;

    monthlyStats: PeriodStatsData[];
    dailyStats7d: PeriodStatsData[];

    newUsersCount: number;
    topCourts: Array<{ courtName: string; bookingCount: number }>;
    peakHour: string;
    occupancyRate: number;
    revenueGrowth: number; 
    newUserGrowth: number;         
    cancellationRateGrowth: number;
  }
