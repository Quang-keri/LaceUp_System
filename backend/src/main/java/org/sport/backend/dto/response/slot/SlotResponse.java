package org.sport.backend.dto.response.slot;

import lombok.*;
import net.minidev.json.annotate.JsonIgnore;
import org.sport.backend.constant.SlotStatus;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotResponse {

    private UUID slotId;

    private UUID courtCopyId;

    private String courtCode;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private BigDecimal price;

    private SlotStatus status;
}
