package org.sport.backend.dto.response.settlement;

import lombok.*;
import org.sport.backend.constant.SettlementStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementResponse {

    private UUID settlementId;

    private UUID rentalAreaId;

    private String rentalAreaName;

    private LocalDate settlementDate;

    private BigDecimal grossAmount;

    private BigDecimal commissionRate;

    private BigDecimal commissionAmount;
    private BigDecimal bookingRevenue;
    private BigDecimal initialPaidAmount;
    private BigDecimal extraServiceAmount;
    private BigDecimal ownerAmount;

    private SettlementStatus status;

    private String transferCode;

    private String note;

    private LocalDateTime paidAt;
}
