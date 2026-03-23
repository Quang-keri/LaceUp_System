package org.sport.backend.dto.request.comission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
public class CommissionConfigDTO {
    private UUID rentalAreaId;
    private Integer minBookings;
    private Integer maxBookings;
    private BigDecimal rate;
    private Boolean isDefault;
    private String note;
}
