package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard/all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFullDashboard(
            @RequestParam(value = "range", defaultValue = "all") String range
    ) {
        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .code(200)
                        .message("Lấy dữ liệu dashboard thành công với mốc: " + range)
                        .result(reportService.getFullDashboardStats(range))
                        .build()
        );
    }
}