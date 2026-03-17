package org.sport.backend.dto.response.court;

import lombok.*;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CourtSummaryResponse {

    private UUID courtId;
    private String courtName;
    private BigDecimal price;
    private Integer totalCourts;
    private String categoryName;
    private String coverImage;
    private List<CourtCopyResponse> courtCopies;

    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private List<CourtPriceResponse> priceRules;
}

