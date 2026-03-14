package org.sport.backend.dto.response.court;

import lombok.*;
import org.sport.backend.constant.CourtStatus;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourtResponse {

    private UUID courtId;

    private String courtName;

    private String courtCode;

    private BigDecimal pricePerHour;

    private CourtStatus status;

    private UUID rentalAreaId;

    private List<CourtImageResponse> images;
    private List<CourtCopyResponse> courtCopies;

}
