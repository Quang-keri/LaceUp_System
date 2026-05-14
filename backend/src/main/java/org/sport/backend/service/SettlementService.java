package org.sport.backend.service;

import org.sport.backend.dto.request.settlement.PayoutConfirmRequest;
import org.sport.backend.dto.response.comission.MonthlySettlementDTO;
import org.sport.backend.dto.response.settlement.AdminSettlementSummaryResponse;
import org.sport.backend.dto.response.settlement.SettlementResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SettlementService {

    List<MonthlySettlementDTO> calculateMonthlySettlements(int month, int year);

    MonthlySettlementDTO calculateSettlementForRentalArea(UUID rentalAreaId, int month, int year);

    void generateDailySettlements(LocalDate date);

    List<SettlementResponse> getSettlementsByDate(LocalDate date);

    AdminSettlementSummaryResponse getSummaryByDate(LocalDate date);

    SettlementResponse markAsPaid(UUID settlementId, PayoutConfirmRequest request, UUID adminId);
    List<SettlementResponse> getOwnerSettlements(UUID rentalAreaId);

}
