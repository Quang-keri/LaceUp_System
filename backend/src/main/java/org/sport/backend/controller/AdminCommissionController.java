package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.comission.CommissionConfigDTO;
import org.sport.backend.entity.CommissionConfig;
import org.sport.backend.service.CommissionConfigService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/commissions")
@RequiredArgsConstructor
public class AdminCommissionController {

    private final CommissionConfigService commissionService;

    @PostMapping
    public ApiResponse<CommissionConfig> createConfig(@RequestBody CommissionConfigDTO request) {
        CommissionConfig result = commissionService.createConfig(request);
        return ApiResponse.success("Tạo cấu hình hoa hồng thành công", result);
    }

    @GetMapping
    public ApiResponse<List<CommissionConfig>> getAllConfigs() {
        return ApiResponse.success(commissionService.getAllConfigs());
    }
}
