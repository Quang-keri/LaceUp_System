package org.sport.backend.dto.request.serviceItem;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class ServiceItemRequest {
    @NotBlank(message = "tên dịch vụ không được để trống")
    private String serviceName;
    private String manufacturer;
    @Min(value = 1, message = "số lượng phải lớn hơn hoặc bằng 1")
    private Integer quantity;

    private String rentalDuration;
    @NotNull(message = "giá bán không được để trống")
    private BigDecimal priceSell;

    private BigDecimal priceOriginal;

    private String serviceNote;

    private Long itemGroupId;

    @NotNull(message = "mã khu vực thuê không được để trống")
    private UUID rentalAreaId;

    private List<MultipartFile> imageUrls;
}
