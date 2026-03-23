package org.sport.backend.dto.request.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    @NotNull(message = "Vui lòng chọn đặt cọc hoặc thanh toán đầy đủ")
    private Boolean isDeposit;
}
