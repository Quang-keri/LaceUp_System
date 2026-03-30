package org.sport.backend.dto.request.serviceItem;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class ServiceItemRequest {
    private String serviceName;
    private Integer quantity;
    private String rentalDuration;
    private BigDecimal priceSell;
    private BigDecimal priceOriginal;
    private String serviceNote;
    private Long itemGroupId;
    private UUID rentalAreaId;
    private List<MultipartFile> imageUrls;
}
