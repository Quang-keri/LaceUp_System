package org.sport.backend.dto.response.payout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sport.backend.constant.PayoutStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayoutHistoryResponseDTO {
    private UUID payoutId;
    private UUID rentalAreaId;
    private int month;
    private int year;
    private BigDecimal payoutAmount;
    private PayoutStatus status;
    private String transactionReference;
    private LocalDateTime createdAt;
}
