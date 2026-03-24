package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.payout.PayoutRequestDTO;
import org.sport.backend.dto.response.payout.PayoutHistoryResponseDTO;
import org.sport.backend.service.PayoutHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payouts")
@RequiredArgsConstructor
public class AdminPayoutController {

    private final PayoutHistoryService payoutService;

    @PostMapping("/confirm")
    public ApiResponse<PayoutHistoryResponseDTO> confirmPayout(@RequestBody PayoutRequestDTO request) {
        // Validation cơ bản
        if (request.getTransactionReference() == null || request.getTransactionReference().isEmpty()) {
            return ApiResponse.error(400, "Mã giao dịch ngân hàng không được để trống");
        }

        try {
            PayoutHistoryResponseDTO result = payoutService.confirmPayout(request);
            return ApiResponse.success("Xác nhận thanh toán cho chủ nhà thành công", result);
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @GetMapping("/rental-area/{rentalAreaId}")
    public ApiResponse<List<PayoutHistoryResponseDTO>> getPayoutHistory(@PathVariable UUID rentalAreaId) {
        List<PayoutHistoryResponseDTO> result = payoutService.getHistoryByRentalArea(rentalAreaId);
        return ApiResponse.success("Lấy lịch sử thanh toán thành công", result);
    }
}
