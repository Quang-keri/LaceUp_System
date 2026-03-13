package org.sport.backend.dto.response.court;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CourtSummaryResponse {

    UUID courtId;
    String courtName;
    BigDecimal price;
    Integer totalCourts;
    String categoryName;
    String coverImage;
}

