package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.payment.CheckoutResponse;
import org.sport.backend.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

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
            CheckoutResponse response = paymentService.handleCheckoutResult(orderCode, status);
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
            for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
                String fieldName = params.nextElement();
                String fieldValue = request.getParameter(fieldName);
                if (fieldValue != null && fieldValue.length() > 0) {
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

}
