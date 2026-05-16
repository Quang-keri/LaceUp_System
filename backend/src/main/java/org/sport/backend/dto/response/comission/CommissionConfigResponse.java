package org.sport.backend.dto.response.comission;


import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
public class CommissionConfigResponse {
    private UUID commissionConfigId;
    private UUID rentalAreaId;
    private String rentalAreaName;
    private Integer minBookings;
    private Integer maxBookings;
    private BigDecimal rate;
    private Boolean isDefault;
    private Boolean isActive;
    private String note;
}
