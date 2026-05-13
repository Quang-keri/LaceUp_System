package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.settlement.PayoutConfirmRequest;
import org.sport.backend.service.SettlementService;
import org.sport.backend.service.UserService;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/admin/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;
    private final UserService userService;

    @PostMapping("/generate")
    public ApiResponse<?> generateDailySettlements(@RequestParam LocalDate date) {
        settlementService.generateDailySettlements(date);
        return ApiResponse.success(200, "Settlements generated successfully", null);
    }

    @GetMapping
    public ApiResponse<?> getSettlementsByDate(@RequestParam LocalDate date) {
        return ApiResponse.success(
                200,
                "Settlements retrieved successfully",
                settlementService.getSettlementsByDate(date)
        );
    }

    @GetMapping("/summary")
    public ApiResponse<?> getSummaryByDate(@RequestParam LocalDate date) {
        return ApiResponse.success(
                200,
                "Settlement summary retrieved successfully",
                settlementService.getSummaryByDate(date)
        );
    }

    @PatchMapping("/{settlementId}/paid")
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
}