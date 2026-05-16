package org.sport.backend.dto.response.finance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerDailyEarningsResponse {
    private UUID earningsId;
    private UUID rentalAreaId;
    private String rentalAreaName;
    private LocalDate earningDate;
    private BigDecimal totalBookingAmount;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private BigDecimal netAmount; // Amount after commission deduction
    private Integer bookingCount;
    private String transferStatus; // PENDING, COMPLETED, FAILED
    private String transferCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
