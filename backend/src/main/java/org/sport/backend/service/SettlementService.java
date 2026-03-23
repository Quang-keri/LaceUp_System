package org.sport.backend.service;

import org.sport.backend.dto.response.comission.MonthlySettlementDTO;

import java.util.List;
import java.util.UUID;

public interface SettlementService {
    List<MonthlySettlementDTO> calculateMonthlySettlements(int month, int year);
    MonthlySettlementDTO calculateSettlementForRentalArea(UUID rentalAreaId, int month, int year);
}
