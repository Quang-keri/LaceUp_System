package org.sport.backend.dto.request.transaction;

import lombok.Data;
import org.sport.backend.constant.TransactionType;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransactionRequest {
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private UUID referenceId;
}
