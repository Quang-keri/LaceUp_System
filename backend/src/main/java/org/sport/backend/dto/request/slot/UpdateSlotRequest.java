package org.sport.backend.dto.request.slot;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class UpdateSlotRequest {

    private UUID slotId;

    private LocalDateTime startTime;

    private LocalDateTime endTime;
}