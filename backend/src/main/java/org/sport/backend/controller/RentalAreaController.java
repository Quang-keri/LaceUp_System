package org.sport.backend.controller;

import jakarta.validation.Valid;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.constant.RentalAreaStatus;
import org.sport.backend.dto.request.rental.RentalAreaRequest;
import org.sport.backend.dto.request.rental.RentalAreaUpdateRequest;
import org.sport.backend.service.RentalAreaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rental-areas")
public class RentalAreaController {

    @Autowired
    private RentalAreaService rentalAreaService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> createRentalArea(
            @Valid @ModelAttribute RentalAreaRequest request
            ) {
        try {
            List<MultipartFile> images = request.getImages();
            System.err.println("images length = " + (images == null ? 0 : images.size()));
            return ApiResponse.success(
                    201,
                    "Create rental successfully",
                    rentalAreaService.createRentalArea(request, images)
            );
        } catch (Exception e) {
            return ApiResponse.success(500, "Create rental failed", e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<?> getAllRentalAreas(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID cityId,
            @RequestParam(required = false) RentalAreaStatus status,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate
    ) {

        return ApiResponse.success(
                200,
                "Get all rental areas successfully",
                rentalAreaService.getAllRentalAreas(
                        page,
                        size,
                        keyword,
                        cityId,
                        status,
                        fromDate,
                        toDate
                )
        );
    }

    @GetMapping("/{rentalAreaId}")
    public ApiResponse<?> getRentalAreaById(@PathVariable UUID rentalAreaId) {

        return ApiResponse.success(
                200,
                "Get rental area successfully",
                rentalAreaService.getRentalAreaById(rentalAreaId)
        );
    }

    @GetMapping("/my-rentals")
    public ApiResponse<?> getMyRentalAreas(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) RentalAreaStatus status,
            @RequestParam(required = false) LocalDateTime fromDate,
            @RequestParam(required = false) LocalDateTime toDate
    ) {

        return ApiResponse.success(
                200,
                "Get my rental areas successfully",
                rentalAreaService.getMyRentalAreas(
                        page,
                        size,
                        keyword,
                        status,
                        fromDate,
                        toDate
                )
        );
    }


    @PutMapping("/{rentalAreaId}")
    public ApiResponse<?> updateRentalArea(
            @PathVariable UUID rentalAreaId,
            @RequestBody RentalAreaUpdateRequest request
    ) {

        try {
            return ApiResponse.success(
                    200,
                    "Update rental area successfully",
                    rentalAreaService.updateRentalArea(rentalAreaId, request)
            );
        } catch (Exception e) {
            return ApiResponse.success(500, "Update rental failed", e.getMessage());
        }
    }

    @DeleteMapping("/{rentalAreaId}")
    public ApiResponse<?> deleteRentalArea(@PathVariable UUID rentalAreaId) {
        try {
            rentalAreaService.deleteRentalArea(rentalAreaId);
            return ApiResponse.success(
                    200,
                    "Delete rental area successfully",
                    null
            );
        } catch (Exception e) {
            return ApiResponse.success(500, "Delete rental failed", e.getMessage());
        }
    }

}
