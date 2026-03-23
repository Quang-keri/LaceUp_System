package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.payment.CheckoutResponse;
import org.sport.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@Tag(name = "11. Payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/checkout")
    public ApiResponse<?> checkout(
            @Valid @RequestBody CheckoutRequest request
    ) {
        try {
            return ApiResponse.success(201,
                    "Payment Checkout successfully",
                    paymentService.checkout(request)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }

    }


    @PostMapping("/checkout-payment")
    public ApiResponse<?> checkoutPayment(
            @Valid @RequestBody CheckoutRequest request
    ) {
        try {
            return ApiResponse.success(201,
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

}
