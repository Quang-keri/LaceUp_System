package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

}
