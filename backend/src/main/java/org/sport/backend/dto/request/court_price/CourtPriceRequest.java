package org.sport.backend.dto.request.court_price;


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
public class CourtPriceRequest {
    private UUID courtId;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal pricePerHour;
    private LocalDate specificDate;
    private PriceType priceType;
    private Integer priority;
}
