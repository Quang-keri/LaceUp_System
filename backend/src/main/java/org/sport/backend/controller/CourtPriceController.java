package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.court_price.CourtPriceRequest;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;
import org.sport.backend.service.CourtPriceService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/courts/prices")
public class CourtPriceController {

    private final CourtPriceService courtPriceService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_COURT_PRICE')")
    public ApiResponse<CourtPriceResponse> create(
            @RequestBody @Valid CourtPriceRequest request
    ) {
        return ApiResponse.success(
                201,
                "Tạo giá thành công",
                courtPriceService.create(request));
    }

    @GetMapping("/{courtId}")
    public ApiResponse<List<CourtPriceResponse>> getByCourt(
            @PathVariable UUID courtId
    ) {
        return ApiResponse.success(
                200,
                "Lấy danh sách giá thành công",
                courtPriceService.getByCourt(courtId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_COURT_PRICE')")
    public ApiResponse<CourtPriceResponse> update(
            @PathVariable UUID id,
            @RequestBody CourtPriceRequest request
    ) {
        return ApiResponse.success(
                200,
                "Cập nhật giá thành công",
                courtPriceService.update(id, request));
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_COURT_PRICE')")
    public ApiResponse<Void> delete(
            @PathVariable UUID id
    ) {
        courtPriceService.delete(id);
        return ApiResponse.success(
                200,
                "Xóa giá thành công",
                null);
    }
}
