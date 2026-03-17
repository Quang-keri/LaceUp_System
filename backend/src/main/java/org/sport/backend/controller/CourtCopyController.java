package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.sport.backend.base.ApiResponse;

import org.sport.backend.constant.CourtCopyStatus;

import org.sport.backend.dto.request.court_copy.CourtCopyRequest;
import org.sport.backend.dto.request.court_copy.CourtCopyUpdateRequest;
import org.sport.backend.service.CourtCopyService;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/court_copies")
@Tag(name = "6. Court Copy")
public class CourtCopyController {

    @Autowired
    private CourtCopyService courtCopyService;

    @PostMapping
    public ApiResponse<?> createCourtCopy(
            @Valid @RequestBody CourtCopyRequest request) {
        try {
            return ApiResponse.success(
                    201,
                    "Create court copy successfully",
                    courtCopyService.createCourt(request)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<?> getCourtCopies(
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
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("{courtCopyId}")
    public ApiResponse<?> getCourtCopyById(@PathVariable UUID courtCopyId) {
        try {
            return ApiResponse.success(
                    200,
                    "Get court copy by id successfully",
                    courtCopyService.getCourtCopyById(courtCopyId)
            );
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PutMapping("{courtCopyId}")
    public ApiResponse<?> updateCourtCopy(@PathVariable UUID courtCopyId, CourtCopyUpdateRequest request) {
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

}
