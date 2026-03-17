package org.sport.backend.controller;


import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.court_price.CourtPriceRequest;
import org.sport.backend.dto.response.court_price.CourtPriceResponse;
import org.sport.backend.service.CourtPriceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/courts/prices")
public class CourtPriceController {

    @Autowired
    private CourtPriceService courtPriceService;

    @PostMapping
    public ApiResponse<?> create(
            @RequestBody CourtPriceRequest request
    ) {
        CourtPriceResponse data = courtPriceService.create(request);
        return ApiResponse.success(201,"Tạo giá thành công", data);
    }

    @GetMapping("/{courtId}")
    public ApiResponse<?> getByCourt(
            @PathVariable UUID courtId
    ) {
        List<CourtPriceResponse> data = courtPriceService.getByCourt(courtId);
        return ApiResponse.success(200,"Lấy danh sách giá thành công", data);
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(
            @PathVariable UUID id,
            @RequestBody CourtPriceRequest request
    ) {
        CourtPriceResponse data = courtPriceService.update(id, request);
        return ApiResponse.success(200,"Cập nhật giá thành công", data);
    }


    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(
            @PathVariable UUID id
    ) {
        courtPriceService.delete(id);
        return ApiResponse.success(200,"Xóa giá thành công", null);
    }
}
