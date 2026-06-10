package org.sport.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.payment.ProcessRefundRequest;
import org.sport.backend.dto.response.payment.RefundResponse;
import org.sport.backend.service.RefundService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/owner/refunds")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_BOOKING')")
public class OwnerRefundController {

    private final RefundService refundService;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<PageResponse<RefundResponse>>> getPendingRefunds(
            @RequestParam(required = false) UUID rentalAreaId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy danh sách owner cần hoàn thành công",
                        refundService.getOwnerPendingRefunds(
                                rentalAreaId,
                                page,
                                size
                        )
                )
        );
    }

    @GetMapping("/completed")
    public ResponseEntity<ApiResponse<PageResponse<RefundResponse>>> getCompletedRefunds(
            @RequestParam(required = false) UUID rentalAreaId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy lịch sử owner hoàn tiền thành công",
                        refundService.getOwnerCompletedRefunds(
                                rentalAreaId,
                                page,
                                size
                        )
                )
        );
    }

    @PutMapping("/{paymentId}/process")
    public ResponseEntity<ApiResponse<Void>> processRefund(
            @PathVariable UUID paymentId,
            @Valid @RequestBody ProcessRefundRequest request
    ) {
        refundService.processOwnerRefund(
                paymentId,
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        Boolean.TRUE.equals(request.getSuccess())
                                ? "Xác nhận chủ sân đã hoàn tiền"
                                : "Đã ghi nhận chủ sân hoàn tiền thất bại",
                        null
                )
        );
    }

}
