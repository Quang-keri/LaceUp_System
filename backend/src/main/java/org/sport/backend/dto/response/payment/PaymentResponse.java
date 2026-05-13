package org.sport.backend.dto.response.payment;

import lombok.*;
import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.constant.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentResponse {
    private UUID paymentId;
    private LocalDateTime transactionDate;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private PaymentType paymentType;
    private UUID userId;
    private UUID bookingId;
    private String channel;
    private String transactionCode;
    private Long orderCode;
    private String payosPaymentLinkId;
}
