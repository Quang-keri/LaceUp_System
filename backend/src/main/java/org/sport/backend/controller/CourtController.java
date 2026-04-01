package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.constant.CourtStatus;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.court.CourtRequest;
import org.sport.backend.dto.request.court.CourtUpdateRequest;
import org.sport.backend.dto.response.court.CourtResponse;
import org.sport.backend.service.CourtService;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/courts")
@Tag(name = "5. Court")
@RequiredArgsConstructor
public class CourtController {

    private final CourtService courtService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    @PreAuthorize("hasAuthority('CREATE_COURT')")
    public ApiResponse<CourtResponse> createCourt(
            @Valid @ModelAttribute CourtRequest request
    ) {
        try {
            List<MultipartFile> images = request.getImages();
            return ApiResponse.success(
                    201,
                    "Create court successfully",
                    courtService.createCourt(request, images)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<PageResponse<CourtResponse>> getAllCourts(
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
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<CourtResponse>> getMyRentalAreas(
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
    public ApiResponse<CourtResponse> getCourtById(
            @PathVariable UUID courtId) {
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
    public ApiResponse<PageResponse<CourtResponse>> getCourtsByRentalArea(
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
    @PreAuthorize("hasAuthority('DELETE_COURT')")
    public ApiResponse<Void> deleteCourt(
            @PathVariable UUID courtId) {
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

    @PutMapping(value = "/{courtId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('UPDATE_COURT')")
    public ApiResponse<CourtResponse> updateCourt(
            @PathVariable UUID courtId,
            @Valid @ModelAttribute("data") CourtUpdateRequest request,
            @RequestParam(value = "images") MultipartFile[] images
    ) {
        return ApiResponse.success(
                200,
                "Update court successfully",
                courtService.updateCourt(courtId, request, List.of(images))
        );
    }

}
