package org.sport.backend.dto.request.court;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.sport.backend.constant.CourtStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourtUpdateRequest {

    @NotNull(message = "tên sân không bỏ trống")
    private String courtName;
    @NotNull(message = "mã phòng không bỏ trống")
    @Size(min = 1, message = "phải có ít nhất 1 mã phòng")
    private List<String> courtCodes;
    @NotNull(message = "loại sân không bỏ trống")
    private Integer categoryId;
    @NotNull(message = "giá sân không bỏ trống")
    private BigDecimal pricePerHour;
    @NotNull(message = "mã nhà không bỏ trống")
    private UUID rentalAreaId;
    @NotNull(message = "trạng thái không bỏ trống")
    private CourtStatus status;


}