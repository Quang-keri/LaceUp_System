package org.sport.backend.dto.request.slot;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class SwapRequest {
    private UUID courtCopyId;
    private LocalDateTime newStartTime;

}
