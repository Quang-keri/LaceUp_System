package org.sport.backend.dto.request.slot;

import lombok.*;
import org.sport.backend.validation.ValidSlotRequest;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@Builder
@NoArgsConstructor
@ValidSlotRequest
public class SlotRequest {
    private UUID courtCopyId;
    private UUID courtId;
    private Integer quantity;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
