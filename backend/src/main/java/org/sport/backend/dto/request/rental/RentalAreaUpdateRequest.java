package org.sport.backend.dto.request.rental;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.sport.backend.constant.RentalAreaStatus;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalAreaUpdateRequest {

    @NotNull(message = "Tên tòa nhà không bỏ trống")
    private String rentalAreaName;
    @NotNull(message = "Địa chị không bỏ trống")
    private String address;
    @NotNull(message = "Tên liên hệ không bỏ trống")
    private String contactName;
    @NotNull(message = "SDT không bỏ trống")
    private String contactPhone;

    private RentalAreaStatus status;

    private Long cityId;

}