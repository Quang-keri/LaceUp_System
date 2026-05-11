package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.response.report.EndOfDayReportDTO;
import org.sport.backend.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

    @GetMapping("/dashboard/admin/chart/overview")
    @PreAuthorize("hasAuthority('VIEW_DASHBOARD_ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOverviewChartAdmin(
            @RequestParam("year") int year,
            @RequestParam(value = "month", required = false) Integer month
    ) {
        return ResponseEntity.ok(
                ApiResponse.<List<Map<String, Object>>>builder()
                        .code(200)
                        .result(reportService.getDynamicOverviewChartAdmin(year, month))
                        .build()
        );
    }

    @GetMapping("/dashboard/owner/chart/overview")
    @PreAuthorize("hasAuthority('VIEW_DASHBOARD_OWNER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOverviewChartOwner(
            @RequestParam("year") int year,
            @RequestParam(value = "month", required = false) Integer month
    ) {
        return ResponseEntity.ok(
                ApiResponse.<List<Map<String, Object>>>builder()
                        .code(200)
                        .result(reportService.getDynamicOverviewChartOwner(year, month))
                        .build()
        );
    }

    @GetMapping("/end-of-day")
    @PreAuthorize("hasAuthority('VIEW_DASHBOARD_OWNER')")
    public ResponseEntity<EndOfDayReportDTO> getEndOfDayReport(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        EndOfDayReportDTO report = reportService.getEndOfDayReport(date);
        return ResponseEntity.ok(report);
    }

}