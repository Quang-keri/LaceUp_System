import type { BookingResponse } from "./booking";
import type { BookingServiceResponse } from "./booking-service";
import type { MatchResponse } from "./match";
import type { PaymentResponse } from "./payment";

export interface EndOfDayReportResponse {
    reportDate: string;
    totalBookingRevenue: number;
    totalServiceRevenue: number;
    totalPaid: number;
    bookings: BookingResponse[];
    matches: MatchResponse[];
    payments: PaymentResponse[];
    serviceItems: BookingServiceResponse[];
}