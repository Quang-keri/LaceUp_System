package org.sport.backend.dto.response.settlement;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class AdminSettlementSummaryResponse {
    private LocalDate date;

    private BigDecimal totalBookingRevenue;

    private BigDecimal totalInitialPaidAmount;

    private BigDecimal totalExtraServiceAmount;

    private BigDecimal totalCommissionAmount;
    private BigDecimal totalOwnerAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal totalPendingAmount;
}
