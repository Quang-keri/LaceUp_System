package org.sport.backend.service;

import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.payment.CheckoutResponse;

import java.util.Map;

public interface PaymentService {
    CheckoutResponse checkout(CheckoutRequest checkoutRequest);

    CheckoutResponse checkoutPayment(CheckoutRequest checkoutRequest);

    Map<String, Object> handlePayOsWebhook(Map<String, Object> payload);

    CheckoutResponse handleCheckoutResult(String orderCode, String status);

    CheckoutResponse handleVnPayReturn(Map<String, String> queryParams);
}
