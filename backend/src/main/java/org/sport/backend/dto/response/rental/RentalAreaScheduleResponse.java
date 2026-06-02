package org.sport.backend.dto.response.rental;

import lombok.*;
import org.sport.backend.dto.response.courtCopy.CourtCopyScheduleResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalAreaScheduleResponse {
    private UUID rentalAreaId;
    private LocalDate date;
    private List<CourtCopyScheduleResponse> courtCopies;
}