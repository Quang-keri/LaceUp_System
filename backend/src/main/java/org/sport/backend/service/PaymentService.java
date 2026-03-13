package org.sport.backend.service;

import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.payment.CheckoutResponse;

public interface PaymentService {
    CheckoutResponse checkout(CheckoutRequest checkoutRequest);
}
