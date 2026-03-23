package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.slot.ExtendRequest;
import org.sport.backend.dto.request.slot.SwapRequest;
import org.sport.backend.dto.response.court.CourtResponse;
import org.sport.backend.dto.response.slot.ExtendCheckResponse;
import org.sport.backend.dto.response.slot.SwapCheckResponse;
import org.sport.backend.service.SlotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/slots")
@Tag(name = "12. Slot")
public class SlotController {

    @Autowired
    private SlotService slotService;

    @GetMapping("/rental/{rentalAreaId}/courts")
    public ApiResponse<List<CourtResponse>> getCourtsByRental(
            @PathVariable UUID rentalAreaId) {
        return ApiResponse.success(200,"get all court of rental successfully",
                slotService.getCourtsByRental(rentalAreaId));
    }
    @PostMapping("/{slotId}/extend/check")
    public ApiResponse<ExtendCheckResponse> checkExtend(
            @PathVariable UUID slotId,
            @RequestBody ExtendRequest request) {
        return ApiResponse.success(
                slotService.checkExtend(slotId, request));
    }
    @PostMapping("/{slotId}/extend/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmExtend(
            @PathVariable UUID slotId,
            @RequestBody ExtendRequest request) {
        slotService.confirmExtend(slotId, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    @PostMapping("/{slotId}/swap/check")
    public ApiResponse<SwapCheckResponse> checkSwap(
            @PathVariable UUID slotId,
            @RequestBody SwapRequest request) {
        // Sửa lại chỗ này
        return ApiResponse.success(slotService.checkSwap(slotId, request));
    }

    @PostMapping("/{slotId}/swap/confirm")
    public ApiResponse<Void> confirmSwap(
            @PathVariable UUID slotId,
            @RequestBody SwapRequest request) {
        slotService.confirmSwap(slotId, request);
        return ApiResponse.success(null);
    }
}
