package org.sport.backend.dto.response.slot;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntentSlotResponse {
    private UUID intentSlotId;
    private UUID courtCopyId;
    private String courtCode;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal price;
}
