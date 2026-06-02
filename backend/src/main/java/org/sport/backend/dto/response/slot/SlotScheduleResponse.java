package org.sport.backend.dto.response.slot;

import lombok.*;
import org.sport.backend.constant.SlotStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotScheduleResponse {
    private UUID slotId;
    private UUID courtCopyId;
    private String courtCode;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal price;
    private SlotStatus slotStatus;
}
