package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.settlement.PayoutConfirmRequest;
import org.sport.backend.dto.response.comission.MonthlySettlementDTO;
import org.sport.backend.dto.response.settlement.SettlementResponse;
import org.sport.backend.service.SettlementService;
import org.sport.backend.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;
    private final UserService userService;

    @PostMapping("/admin/generate")
    public ApiResponse<?> generateDailySettlements(@RequestParam LocalDate date) {
        settlementService.generateDailySettlements(date);
        return ApiResponse.success(200, "Settlements generated successfully", null);
    }

    @GetMapping("/admin")
    public ApiResponse<?> getSettlementsByDate(@RequestParam LocalDate date) {
        return ApiResponse.success(
                200,
                "Settlements retrieved successfully",
                settlementService.getSettlementsByDate(date)
        );
    }

    @GetMapping("/admin/summary")
    public ApiResponse<?> getSummaryByDate(@RequestParam LocalDate date) {
        return ApiResponse.success(
                200,
                "Settlement summary retrieved successfully",
                settlementService.getSummaryByDate(date)
        );
    }

    @PatchMapping("/admin/{settlementId}/paid")
    public ApiResponse<?> markAsPaid(
            @PathVariable UUID settlementId,
            @RequestBody PayoutConfirmRequest request
    ) {
        UUID adminId = userService.getCurrentUserEntity().getUserId();

        return ApiResponse.success(
                200,
                "Settlement marked as paid successfully",
                settlementService.markAsPaid(settlementId, request, adminId)
        );
    }

    @GetMapping("/admin/monthly")
    public ApiResponse<List<MonthlySettlementDTO>> getMonthlySettlements(
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ApiResponse.success(
                200,
                "Lấy báo cáo đối soát tháng thành công",
                settlementService.calculateMonthlySettlements(month, year)
        );
    }

    @GetMapping("/admin/monthly/{rentalAreaId}")
    public ApiResponse<MonthlySettlementDTO> getSettlementForRentalArea(
            @PathVariable UUID rentalAreaId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ApiResponse.success(
                200,
                "Lấy báo cáo khu vực thành công",
                settlementService.calculateSettlementForRentalArea(rentalAreaId, month, year)
        );
    }


    @GetMapping("/owner/rental-areas/{rentalAreaId}")
    public ApiResponse<List<SettlementResponse>> getOwnerSettlements(
            @PathVariable UUID rentalAreaId
    ) {
        return ApiResponse.success(
                200,
                "Lấy lịch sử nhận tiền thành công",
                settlementService.getOwnerSettlements(rentalAreaId)
        );
    }
}