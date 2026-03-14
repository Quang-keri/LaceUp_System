package org.sport.backend.dto.request.rental;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class RentalAreaRequest {

    @NotNull(message = "mã người dùng không bỏ trống")
    private UUID userId;
    @NotNull(message = "tên tòa nhà không bỏ trống")
    private String rentalAreaName;

    @NotNull(message = "địa chỉ tòa nhà không bỏ trống")
    private String address;

    @NotNull(message = "tên liên hệ không bỏ trống")
    private String contactName;

    @NotNull(message = "số điện thoại không bỏ trống")
    private String contactPhone;

    @NotNull(message = "thành phố không bỏ trống")
    private Long cityId;

    private List<MultipartFile> images;
}
