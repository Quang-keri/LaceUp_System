package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.comission.CommissionConfigDTO;
import org.sport.backend.entity.CommissionConfig;
import org.sport.backend.service.CommissionConfigService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/commissions")
@RequiredArgsConstructor
public class AdminCommissionController {

    private final CommissionConfigService commissionService;

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_COMMISSION')")
    public ApiResponse<CommissionConfig> createConfig(
            @RequestBody CommissionConfigDTO request
    ) {
        return ApiResponse.success(
                200,
                "Tạo cấu hình hoa hồng thành công",
                commissionService.createConfig(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_COMMISSION')")
    public ApiResponse<List<CommissionConfig>> getAllConfigs() {
        return ApiResponse.success(
                200,
                "Lấy danh sách cấu hình thành công",
                commissionService.getAllConfigs());
    }
}
