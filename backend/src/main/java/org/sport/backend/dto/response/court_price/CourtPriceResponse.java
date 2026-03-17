package org.sport.backend.dto.response.court_price;


import lombok.*;
import org.sport.backend.constant.PriceType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;


@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Setter
public class CourtPriceResponse {

    private UUID courtPriceId;
    private UUID courtId;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal pricePerHour;
    private LocalDate specificDate;
    private PriceType priceType;
    private Integer priority;
}
