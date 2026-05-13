package org.sport.backend.dto.response.report;

import lombok.*;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.dto.response.payment.PaymentResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportResponse {
    private LocalDate reportDate;
    private BigDecimal totalBookingRevenue;
    private BigDecimal totalServiceRevenue;
    private BigDecimal totalPaid;

    private List<BookingResponse> bookings;
    private List<MatchResponse> matches;
    private List<PaymentResponse> payments;
    private List<BookingResponse.BookingServiceResponse> serviceItems;
}
