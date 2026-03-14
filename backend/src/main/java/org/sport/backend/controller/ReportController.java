package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard/booking-counts")
    public ResponseEntity<ApiResponse<Map<BookingStatus, Long>>> getBookingCountsForDashboard() {
        return ResponseEntity.ok(
                ApiResponse.<Map<BookingStatus, Long>>builder()
                        .code(200)
                        .message("Get count booking by all status successfully")
                        .result(reportService.getDashboardStats())
                        .build()
        );
    }
}
