package org.sport.backend.service;

import org.sport.backend.constant.TransactionType;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.transaction.TransactionRequest;
import org.sport.backend.dto.response.transaction.TransactionResponse;
import org.sport.backend.dto.response.transaction.TransactionSummaryResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public interface TransactionService {
    PageResponse<TransactionResponse> getRentalAreaTransactions(
            UUID rentalAreaId,
            int page,
            int size,
            String keyword,
            TransactionType type,
            LocalDateTime startDate,
            LocalDateTime endDate
    );
    PageResponse<TransactionResponse> getTransactions(
            int page,
            int size,
            String keyword,
            TransactionType type,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    PageResponse<TransactionResponse> getOwnerTransactions(
            UUID ownerId,
            int page,
            int size,
            TransactionType type
    );

    TransactionResponse createTransaction(TransactionRequest request);

    TransactionResponse updateTransaction(UUID id, TransactionRequest request);

    TransactionSummaryResponse getRentalAreaTransactionSummary(UUID rentalAreaId, LocalDate startDate, LocalDate endDate);
}
