package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.TransactionType;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.transaction.TransactionRequest;
import org.sport.backend.dto.response.transaction.TransactionResponse;

import org.sport.backend.service.TransactionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping("/admin")
    public ApiResponse<PageResponse<TransactionResponse>> getAllTransactionsForAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        return ApiResponse.success(
                200,
                "Get all system transactions successfully",
                transactionService.getTransactions(page, size, keyword, type, startDate, endDate)
        );
    }

    @PostMapping
    public ApiResponse<TransactionResponse> create(@RequestBody TransactionRequest request) {
        return ApiResponse.success(201,"Create transaction successfully",transactionService.createTransaction(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<TransactionResponse> update(@PathVariable UUID id, @RequestBody TransactionRequest request) {
        return ApiResponse.success(200,"Update transaction",transactionService.updateTransaction(id, request));
    }


    @GetMapping("/owner/{ownerId}")
    public ApiResponse<PageResponse<TransactionResponse>> getOwnerTransactions(
            @PathVariable UUID ownerId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) TransactionType type
    ) {
        return ApiResponse.success(
                200,
                "Get owner transactions successfully",
                transactionService.getOwnerTransactions(ownerId, page, size, type)
        );
    }
    @GetMapping("/rental-area/{rentalAreaId}")
    public ApiResponse<PageResponse<TransactionResponse>> getRentalAreaTransactions(
            @PathVariable UUID rentalAreaId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        return ApiResponse.success(
                200,
                "Get rental area transactions successfully",
                transactionService.getRentalAreaTransactions(
                        rentalAreaId,
                        page,
                        size,
                        keyword,
                        type,
                        startDate,
                        endDate
                )
        );
    }
}
