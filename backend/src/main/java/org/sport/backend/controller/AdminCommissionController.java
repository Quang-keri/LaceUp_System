package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.comission.CommissionConfigDTO;
import org.sport.backend.dto.response.comission.CommissionConfigResponse;
import org.sport.backend.service.CommissionConfigService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/commission-configs")
@RequiredArgsConstructor
public class AdminCommissionController {

    private final CommissionConfigService commissionService;

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_COMMISSION')")
    public ApiResponse<CommissionConfigResponse> createConfig(
            @RequestBody CommissionConfigDTO request
    ) {
        return ApiResponse.success(
                200,
                "Tạo cấu hình hoa hồng thành công",
                commissionService.createConfig(request)
        );
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_COMMISSION')")
    public ApiResponse<List<CommissionConfigResponse>> getAllConfigs() {
        return ApiResponse.success(
                200,
                "Lấy danh sách cấu hình thành công",
                commissionService.getAllConfigs()
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_COMMISSION')")
    public ApiResponse<CommissionConfigResponse> updateConfig(
            @PathVariable UUID id,
            @RequestBody CommissionConfigDTO request
    ) {
        return ApiResponse.success(
                200,
                "Cập nhật cấu hình hoa hồng thành công",
                commissionService.updateConfig(id, request)
        );
    }
}