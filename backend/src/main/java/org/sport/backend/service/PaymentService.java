package org.sport.backend.service;

import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.payment.CheckoutResponse;
import org.sport.backend.dto.response.payment.RefundResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

public interface PaymentService {
    CheckoutResponse checkout(CheckoutRequest checkoutRequest);

    CheckoutResponse checkoutPayment(CheckoutRequest checkoutRequest);

    Map<String, Object> handlePayOsWebhook(Map<String, Object> payload);

    CheckoutResponse handleCheckoutResult(String orderCode, String status);

    CheckoutResponse handleVnPayReturn(Map<String, String> queryParams);

    @Transactional
    CheckoutResponse checkoutMatchJoin(UUID registrationId, PaymentMethod method);

    PageResponse<RefundResponse> getPendingRefunds(int page, int size);

    PageResponse<RefundResponse> getCompletedRefunds(int page, int size);

    @Transactional
    void confirmManualRefund(UUID paymentId);
}
