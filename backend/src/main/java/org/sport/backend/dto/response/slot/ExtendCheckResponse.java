package org.sport.backend.dto.response.slot;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ExtendCheckResponse {
    private boolean available;
    private BigDecimal extraPrice;   // phí phát sinh thêm
    private LocalDateTime newEndTime;
    private String conflictReason;   // nếu available=false
}
