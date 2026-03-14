package org.sport.backend.dto.response.courtCopy;

import lombok.*;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.dto.response.slot.SlotResponse;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourtCopyResponse {
    private UUID courtCopyId;
    private String courtCode;
    private CourtCopyStatus status;
    private List<SlotResponse> slots;
}
