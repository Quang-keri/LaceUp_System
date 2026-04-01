package org.sport.backend.dto.response.serviceItem;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ServiceItemResponse {
    private UUID id;
    private String serviceName;
    private Integer quantity;
    private String rentalDuration;
    private BigDecimal priceSell;
    private BigDecimal priceOriginal;
    private String serviceNote;
    private Long itemGroupId;
    private String itemGroupName;
    private UUID rentalAreaId;
    private List<String> images;
}
