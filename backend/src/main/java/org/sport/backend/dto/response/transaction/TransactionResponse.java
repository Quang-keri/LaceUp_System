package org.sport.backend.dto.response.transaction;

import lombok.Builder;
import lombok.Data;
import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.constant.TransactionCategory;
import org.sport.backend.constant.TransactionStatus;
import org.sport.backend.constant.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TransactionResponse {
    private UUID id;
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private String referenceId;
    private LocalDateTime transactionDate;
    private PaymentMethod paymentMethod;

    private TransactionStatus status;
    private TransactionCategory category;

    private UUID bookingId;

    private UUID rentalAreaId;
    private String rentalAreaName;

    private UUID ownerId;
    private String ownerName;
}