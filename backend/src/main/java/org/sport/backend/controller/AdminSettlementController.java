package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.response.comission.MonthlySettlementDTO;
import org.sport.backend.service.SettlementService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/settlements")
@RequiredArgsConstructor
public class AdminSettlementController {

    private final SettlementService settlementService;

    @GetMapping("/monthly")
    public ApiResponse<List<MonthlySettlementDTO>> getMonthlySettlements(
            @RequestParam int month,
            @RequestParam int year) {

        List<MonthlySettlementDTO> result = settlementService.calculateMonthlySettlements(month, year);
        return ApiResponse.success("Lấy báo cáo đối soát tháng " + month + "/" + year + " thành công", result);
    }

    @GetMapping("/monthly/{rentalAreaId}")
    public ApiResponse<MonthlySettlementDTO> getSettlementForRentalArea(
            @PathVariable UUID rentalAreaId,
            @RequestParam int month,
            @RequestParam int year) {

        MonthlySettlementDTO result = settlementService.calculateSettlementForRentalArea(rentalAreaId, month, year);
        return ApiResponse.success(result);
    }
}
