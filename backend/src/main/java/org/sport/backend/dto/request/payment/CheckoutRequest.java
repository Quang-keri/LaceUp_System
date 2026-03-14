package org.sport.backend.dto.request.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.sport.backend.constant.PaymentMethod;

import java.util.UUID;

@Getter
public class CheckoutRequest {
    @NotNull(message = "Mã booking intent không được bỏ trống")
    private UUID bookingIntentId;
    @NotNull(message = "Phương thức thanh toán không được bỏ trống")
    private PaymentMethod paymentMethod;
}
