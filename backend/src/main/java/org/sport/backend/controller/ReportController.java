package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.response.report.ReportResponse;
import org.sport.backend.service.ExcelService;
import org.sport.backend.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "17. Report")
@Slf4j
public class ReportController {

    private final ReportService reportService;
    private final ExcelService excelService;

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
    public ResponseEntity<ReportResponse> getEndOfDayReport(
            @RequestParam(value = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "rentalAreaId") UUID rentalAreaId) { // Thêm tham số rentalAreaId

        ReportResponse report = reportService.getEndOfDayReport(startDate, endDate, rentalAreaId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/end-of-day/export")
    @PreAuthorize("hasAuthority('VIEW_DASHBOARD_OWNER')")
    public ResponseEntity<byte[]> exportEndOfDayReport(
            @RequestParam(value = "startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "rentalAreaId") UUID rentalAreaId) { // Thêm tham số rentalAreaId khi xuất Excel

        try {
            ReportResponse data = reportService.getEndOfDayReport(startDate, endDate, rentalAreaId);

            byte[] excelBytes = excelService.generateRevenueReport(data);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

            String fileName = "Doanh_Thu_LaceUp_" + startDate.toString() + ".xlsx";
            headers.setContentDispositionFormData("attachment", fileName);

            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);

        } catch (IOException e) {
            log.error(e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}