package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.payout.PayoutRequestDTO;
import org.sport.backend.dto.response.payout.PayoutHistoryResponseDTO;
import org.sport.backend.service.PayoutHistoryService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payouts")
@RequiredArgsConstructor
public class AdminPayoutController {

    private final PayoutHistoryService payoutService;

    @PostMapping("/confirm")
    @PreAuthorize("hasAuthority('MANAGE_PAYOUT')")
    public ApiResponse<PayoutHistoryResponseDTO> confirmPayout(
            @RequestBody PayoutRequestDTO request
    ) {
        if (request.getTransactionReference() == null
                || request.getTransactionReference().isEmpty()) {
            return ApiResponse.error(
                    400, "Mã giao dịch ngân hàng không được để trống");
        }

        try {
            return ApiResponse.success(
                    200,
                    "Xác nhận thanh toán cho chủ nhà thành công",
                    payoutService.confirmPayout(request));
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @GetMapping("/rental-area/{rentalAreaId}")
    @PreAuthorize("hasAuthority('VIEW_PAYOUT')")
    public ApiResponse<List<PayoutHistoryResponseDTO>> getPayoutHistory(
            @PathVariable UUID rentalAreaId
    ) {
        return ApiResponse.success(
                200,
                "Lấy lịch sử thanh toán thành công",
                payoutService.getHistoryByRentalArea(rentalAreaId));
    }
}
