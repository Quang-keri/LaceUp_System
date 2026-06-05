package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.match.MatchCheckoutRequest;
import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.payment.CheckoutResponse;
import org.sport.backend.service.PaymentService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@Tag(name = "11. Payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/checkout")
//    @PreAuthorize("hasAuthority('CREATE_PAYMENT')")
    public ApiResponse<CheckoutResponse> checkout(
            @Valid @RequestBody CheckoutRequest request
    ) {
        try {
            return ApiResponse.success(
                    201,
                    "Payment Checkout successfully",
                    paymentService.checkout(request)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }

    }


    @PostMapping("/checkout-payment")
//    @PreAuthorize("hasAuthority('CREATE_PAYMENT')")
    public ApiResponse<CheckoutResponse> checkoutPayment(
            @Valid @RequestBody CheckoutRequest request
    ) {
        try {
            return ApiResponse.success(
                    201,
                    "Payment Checkout successfully",
                    paymentService.checkoutPayment(request)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PostMapping("/payos/webhook")
    public ResponseEntity<Map<String, Object>> handlePayOsWebhook(
            @RequestBody Map<String, Object> payload
    ) {
        return ResponseEntity.ok(paymentService.handlePayOsWebhook(payload));
    }

    @GetMapping("/result")
    public ApiResponse<CheckoutResponse> handleResult(
            @RequestParam String orderCode,
            @RequestParam String status
    ) {
        try {
            CheckoutResponse response =
                    paymentService.handleCheckoutResult(orderCode, status);
            return ApiResponse.<CheckoutResponse>builder()
                    .code(200)
                    .message("Handle payment result successfully")
                    .result(response)
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("/vnpay/return")
    public ApiResponse<CheckoutResponse> vnpayReturn(HttpServletRequest request) {
        try {

            Map<String, String> fields = new HashMap<>();
            for (Enumeration<String> params =
                 request.getParameterNames(); params.hasMoreElements(); ) {
                String fieldName = params.nextElement();
                String fieldValue = request.getParameter(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    fields.put(fieldName, fieldValue);
                }
            }


            CheckoutResponse response = paymentService.handleVnPayReturn(fields);

            return ApiResponse.<CheckoutResponse>builder()
                    .code(200)
                    .message("Xử lý kết quả VNPay thành công")
                    .result(response)
                    .build();
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PostMapping("/checkout-match")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<CheckoutResponse> checkoutMatchJoin(
            @Valid @RequestBody MatchCheckoutRequest request
    ) {
        try {
            return ApiResponse.success(
                    201,
                    "Tạo link thanh toán ghép trận thành công",
                    paymentService.checkoutMatchJoin(
                            request.getRegistrationId(),
                            request.getPaymentMethod())
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PostMapping(
            value = "/match/upload-proof",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> uploadMatchPaymentProof(
            @RequestParam("registrationId") UUID registrationId,
            @RequestParam("file") MultipartFile file) {

        paymentService.uploadMatchPaymentProof(registrationId, file);

        return ApiResponse.builder()
                .code(200)
                .message("Tải ảnh chứng từ thành công, vui lòng chờ duyệt!")
                .build();
    }

    @GetMapping("/owner/match-payments")
    public ApiResponse<?> getMatchPaymentsForOwner(
            @RequestParam(required = false, defaultValue = "PENDING") String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        return ApiResponse.builder()
                .code(200)
                .message("Lấy danh sách thành công")
                .result(paymentService.getMatchPaymentsForOwner(status, keyword, startDate, endDate))
                .build();
    }

    @PostMapping("/owner/confirm-match-payment/{paymentId}")
    public ApiResponse<?> confirmMatchPayment(
            @PathVariable java.util.UUID paymentId,
            @RequestParam boolean isApproved) {

        paymentService.confirmMatchPayment(paymentId, isApproved);

        return ApiResponse.builder()
                .code(200)
                .message(isApproved ? "Đã duyệt thanh toán thành công" : "Đã từ chối thanh toán")
                .build();
    }

}
