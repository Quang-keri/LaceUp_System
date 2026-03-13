package org.sport.backend.dto.response.payment;

import lombok.*;
import org.sport.backend.constant.PaymentStatus;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutResponse {
    private String mode;
    private PaymentStatus paymentStatus;
    private UUID bookingId;
    private String paymentUrl;
    private String orderCode;
    private String message;
}
