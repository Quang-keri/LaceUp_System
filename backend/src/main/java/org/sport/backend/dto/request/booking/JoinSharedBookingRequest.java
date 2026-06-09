package org.sport.backend.dto.request.booking;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JoinSharedBookingRequest {

    @NotNull(message = "Số lượng người không được để trống")
    @Min(value = 1, message = "Số lượng người phải ít nhất là 1")
    private Integer quantity;
}
