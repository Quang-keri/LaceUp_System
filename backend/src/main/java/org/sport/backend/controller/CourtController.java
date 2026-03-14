package org.sport.backend.controller;

import jakarta.validation.Valid;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.constant.CourtStatus;

import org.sport.backend.dto.request.court.CourtRequest;
import org.sport.backend.dto.request.court.CourtUpdateRequest;

import org.sport.backend.service.CourtService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/courts")
public class CourtController {

    @Autowired
    private CourtService courtService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> createCourt(
            @Valid @ModelAttribute CourtRequest request,
            @RequestParam(value = "images", required = false) MultipartFile[] images
    ) {
        try {
            return ApiResponse.success(
                    201,
                    "Create court successfully",
                    courtService.createCourt(request, List.of(images))
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<?> getAllCourts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CourtStatus status,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate
    ) {
        try {
            return ApiResponse.success(
                    200,
                    "Get all courts  successfully",
                    courtService.getAllCourts(
                            page,
                            size,
                            keyword,
                            status,
                            fromDate,
                            toDate
                    )
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("/my-courts")
    public ApiResponse<?> getMyRentalAreas(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CourtStatus status,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate
    ) {
        try {
            return ApiResponse.success(
                    200,
                    "Get my rental areas successfully",
                    courtService.getMyCourts(page, size, keyword, status, fromDate, toDate)

            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("/{courtId}")
    public ApiResponse<?> getCourtById(@PathVariable UUID courtId) {
        try {
            return ApiResponse.success(
                    200,
                    "Get court successfully",
                    courtService.getCourtById(courtId)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("/rental-area/{rentalAreaId}")
    public ApiResponse<?> getCourtsByRentalArea(
            @PathVariable UUID rentalAreaId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword
    ) {
        try {
            return ApiResponse.success(
                    200,
                    "Get courts by rental area successfully",
                    courtService.getCourtsByRentalArea(rentalAreaId, page, size, keyword)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @DeleteMapping("/{courtId}")
    public ApiResponse<?> deleteCourt(@PathVariable UUID courtId) {
        try {
            courtService.deleteCourt(courtId);
            return ApiResponse.success(
                    200,
                    "Delete court successfully",
                    null
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PutMapping(value = "/{courtId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> updateCourt(
            @PathVariable UUID courtId,
            @Valid  @ModelAttribute("data")  CourtUpdateRequest request,
            @RequestParam(value = "images", required = false) MultipartFile[] images
    ) {
        return ApiResponse.success(
                200,
                "Update rental area successfully",
                courtService.updateCourt(courtId, request, List.of(images))
        );
    }

}
