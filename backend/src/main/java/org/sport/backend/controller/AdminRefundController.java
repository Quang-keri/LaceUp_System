package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.response.payment.RefundResponse;
import org.sport.backend.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/refunds")
@RequiredArgsConstructor
public class AdminRefundController {

    private final PaymentService paymentService;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<PageResponse<RefundResponse>>> getPendingRefunds(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<RefundResponse>>builder()
                        .code(200)
                        .message("Lấy danh sách hoàn tiền thành công.")
                        .result(paymentService.getPendingRefunds(page, size))
                        .build()
        );
    }

    @GetMapping("/completed")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<RefundResponse>>> getCompletedRefunds(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<RefundResponse>>builder()
                        .code(200)
                        .message("Lấy danh sách đã hoàn tiền thành công")
                        .result(paymentService.getCompletedRefunds(page, size))
                        .build()
        );
    }

    @PostMapping("/{paymentId}/confirm")
    public ApiResponse<String> confirmRefund(@PathVariable UUID paymentId) {
        paymentService.confirmManualRefund(paymentId);
        return ApiResponse.success(
                200,
                "Đã xác nhận hoàn tiền thành công!",
                null);
    }
}