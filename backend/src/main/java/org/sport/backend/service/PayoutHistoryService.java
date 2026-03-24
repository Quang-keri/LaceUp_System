package org.sport.backend.service;

import org.sport.backend.dto.request.payout.PayoutRequestDTO;
import org.sport.backend.dto.response.payout.PayoutHistoryResponseDTO;

import java.util.List;
import java.util.UUID;

public interface PayoutHistoryService {
    PayoutHistoryResponseDTO confirmPayout(PayoutRequestDTO request);
    List<PayoutHistoryResponseDTO> getHistoryByRentalArea(UUID rentalAreaId);
}
