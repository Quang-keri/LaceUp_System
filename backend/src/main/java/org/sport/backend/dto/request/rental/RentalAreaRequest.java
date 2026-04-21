package org.sport.backend.dto.request.rental;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;
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
    private String street;
    @NotNull(message = "địa chỉ tòa nhà không bỏ trống")
    private String ward;
    @NotNull(message = "địa chỉ tòa nhà không bỏ trống")
    private String district;

    private Long cityId;
    private String cityName;

    @NotNull(message = "tên liên hệ không bỏ trống")
    private String contactName;

    @NotNull(message = "số điện thoại không bỏ trống")
    private String contactPhone;
    private String latitude;
    private String longitude;
    private LocalTime openTime;
    private LocalTime closeTime;
    private String facebookLink;
    private String gmailLink;
    private List<MultipartFile> images;
}
