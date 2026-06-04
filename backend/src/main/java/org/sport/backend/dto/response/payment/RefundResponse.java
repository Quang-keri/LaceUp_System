package org.sport.backend.dto.response.payment;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RefundResponse {
    private UUID paymentId;
    private String userName;
    private String phone;
    private BigDecimal amount;
    private String paymentMethod;
    private String orderCode;
    private LocalDateTime transactionDate;
    private String source;
    private String referenceCode;
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private String qrCodeUrl;
}
