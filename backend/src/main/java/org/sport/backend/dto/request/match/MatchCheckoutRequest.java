package org.sport.backend.dto.request.match;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.sport.backend.constant.PaymentMethod;

import java.util.UUID;

@Data
public class MatchCheckoutRequest {
    @NotNull(message = "Thiếu ID đăng ký trận đấu")
    private UUID registrationId;

    @NotNull(message = "Thiếu phương thức thanh toán")
    private PaymentMethod paymentMethod;
}