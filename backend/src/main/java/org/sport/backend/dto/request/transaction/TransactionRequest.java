package org.sport.backend.dto.request.transaction;

import lombok.Data;
import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.constant.TransactionCategory;
import org.sport.backend.constant.TransactionStatus;
import org.sport.backend.constant.TransactionType;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransactionRequest {
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private UUID referenceId;
    private TransactionStatus status;
    private PaymentMethod paymentMethod;
    private TransactionCategory category;
    private UUID rentalAreaId;
}
