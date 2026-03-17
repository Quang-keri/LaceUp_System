package org.sport.backend.dto.request.slot;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class UpdateSlotRequest {

    @NotNull(message = "Slot ID không được trống")
    private UUID slotId;

    @NotNull(message = "Court Copy ID không được trống")
    private UUID courtCopyId;

    @NotNull(message = "Thời gian bắt đầu không được trống")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được trống")
    private LocalDateTime endTime;
}