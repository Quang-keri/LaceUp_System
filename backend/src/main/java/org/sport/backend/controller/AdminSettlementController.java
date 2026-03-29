package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.response.comission.MonthlySettlementDTO;
import org.sport.backend.service.SettlementService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/settlements")
@RequiredArgsConstructor
public class AdminSettlementController {

    private final SettlementService settlementService;

    @GetMapping("/monthly")
    @PreAuthorize("hasAuthority('VIEW_REPORT') or hasAuthority('MANAGE_FINANCE')")
    public ApiResponse<List<MonthlySettlementDTO>> getMonthlySettlements(
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ApiResponse.success(
                200,
                "Lấy báo cáo đối soát tháng " + month + "/" + year + " thành công",
                settlementService.calculateMonthlySettlements(month, year)
        );
    }

    @GetMapping("/monthly/{rentalAreaId}")
    @PreAuthorize("hasAuthority('MANAGE_FINANCE')")
    public ApiResponse<MonthlySettlementDTO> getSettlementForRentalArea(
            @PathVariable UUID rentalAreaId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ApiResponse.success(
                200,
                "Lấy báo cáo khu vực thành công",
                settlementService.calculateSettlementForRentalArea(rentalAreaId, month, year));
    }
}
