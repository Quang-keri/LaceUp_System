package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "17. Report")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard/owner")
    @PreAuthorize("hasAuthority('VIEW_DASHBOARD_OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardOwner(
            @RequestParam(value = "range", defaultValue = "all") String range
    ) {
        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .code(200)
                        .result(reportService.getFullDashboardStatsOwner(range))
                        .build()
        );
    }

    @GetMapping("/dashboard/admin")
    @PreAuthorize("hasAuthority('VIEW_DASHBOARD_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardAdmin(
            @RequestParam(value = "range", defaultValue = "all") String range
    ) {
        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .code(200)
                        .result(reportService.getFullDashboardStatsAdmin(range))
                        .build()
        );
    }
}