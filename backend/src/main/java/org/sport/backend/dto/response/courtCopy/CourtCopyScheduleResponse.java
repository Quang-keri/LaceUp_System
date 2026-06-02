package org.sport.backend.dto.response.courtCopy;

import lombok.*;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.dto.response.slot.SlotScheduleResponse;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourtCopyScheduleResponse {
    private UUID courtId;
    private String courtName;
    private UUID courtCopyId;
    private String courtCode;
    private CourtCopyStatus status;
    private List<SlotScheduleResponse> slots;
}