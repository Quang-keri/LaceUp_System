package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.response.review.ReviewResponse;

import org.sport.backend.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService adminReviewService;

    @GetMapping("/stats")
//    @PreAuthorize("hasAuthority('VIEW_DASHBOARD_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {

        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .code(200)
                        .result(
                                adminReviewService.getReviewStats()
                        )
                        .build()
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String rentalName,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {

        return ResponseEntity.ok(
                ApiResponse.<PageResponse<ReviewResponse>>builder()
                        .code(200)
                        .result(adminReviewService.getReviews(
                                page, size, rating, rentalName, userName, address, startDate, endDate
                        ))
                        .build()
        );
    }
}