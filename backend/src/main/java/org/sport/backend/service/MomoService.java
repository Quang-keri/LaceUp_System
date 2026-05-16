package org.sport.backend.service;

import java.util.Map;

public interface MomoService {
    String createMomoPayment(String orderId, long amount, String orderInfo) throws Exception;

    boolean verifySignature(Map<String, Object> ipnData, String receivedSignature);
}
