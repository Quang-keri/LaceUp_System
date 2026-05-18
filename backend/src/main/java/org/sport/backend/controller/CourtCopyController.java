package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.court_copy.CourtCopyRequest;
import org.sport.backend.dto.request.court_copy.CourtCopyUpdateRequest;
import org.sport.backend.dto.response.courtCopy.CourtCopyResponse;
import org.sport.backend.service.CourtCopyService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/court_copies")
@Tag(name = "6. Court Copy")
@RequiredArgsConstructor
public class CourtCopyController {

    private final CourtCopyService courtCopyService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_COURT_COPY')")
    public ApiResponse<CourtCopyResponse> createCourtCopy(
            @Valid @RequestBody CourtCopyRequest request) {
        try {
            return ApiResponse.success(
                    201,
                    "Create court copy successfully",
                    courtCopyService.createCourt(request)
            );
        } catch (Exception e) {
            return ApiResponse.error(
                    500,
                    e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<PageResponse<CourtCopyResponse>> getCourtCopies(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CourtCopyStatus status,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate

    ) {
        try {
            return ApiResponse.success(
                    200,
                    "Gall court copy successfully",
                    courtCopyService.getCourtCopies(page, size, keyword, status, fromDate, toDate)
            );
        } catch (Exception e) {
            return ApiResponse.error(
                    500,
                    e.getMessage());
        }
    }

    @GetMapping("{courtCopyId}")
    public ApiResponse<CourtCopyResponse> getCourtCopyById(
            @PathVariable UUID courtCopyId) {
        try {
            return ApiResponse.success(
                    200,
                    "Get court copy by id successfully",
                    courtCopyService.getCourtCopyById(courtCopyId)
            );
        } catch (Exception e) {
            return ApiResponse.error(
                    500,
                    e.getMessage());
        }
    }

    @GetMapping("{courtCopyId}/availability")
    public ApiResponse<Boolean> checkAvailability(
            @PathVariable UUID courtCopyId,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end,

            @RequestParam(required = false) UUID excludeSlotId
    ) {
        try {
            return ApiResponse.success(
                    200,
                    "Check availability",
                    courtCopyService.checkAvailability(
                            courtCopyId, start, end, excludeSlotId
                    ));

        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PutMapping("{courtCopyId}")
    @PreAuthorize("hasAuthority('UPDATE_COURT_COPY')")
    public ApiResponse<CourtCopyResponse> updateCourtCopy(
            @PathVariable UUID courtCopyId,
            @RequestBody @Valid CourtCopyUpdateRequest request) {
        try {
            return ApiResponse.success(
                    200,
                    "Update court copy by id successfully",
                    courtCopyService.updateCourtCopy(courtCopyId, request)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("/my-rental-area/{rentalAreaId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<CourtCopyResponse>> getCourtCopiesByRentalArea(
            @PathVariable UUID rentalAreaId
    ) {
        try {
            return ApiResponse.success(
                    200,
                    "Get court copies by rental area successfully",
                    courtCopyService.getCourtCopiesByRentalArea(rentalAreaId)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

}
