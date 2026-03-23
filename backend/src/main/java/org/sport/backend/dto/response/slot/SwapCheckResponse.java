package org.sport.backend.dto.response.slot;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SwapCheckResponse {
    private boolean available;
    private BigDecimal priceDiff;
    private BigDecimal newPrice;
    private String conflictReason;
}
