package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.VerificationStatus;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.constant.RentalAreaStatus;
import org.sport.backend.dto.request.rental.RejectRentalAreaRequest;
import org.sport.backend.dto.request.rental.RentalAreaRequest;
import org.sport.backend.dto.request.rental.RentalAreaUpdateRequest;
import org.sport.backend.dto.response.rental.RentalAreaResponse;
import org.sport.backend.dto.response.serviceItem.ServiceItemResponse;
import org.sport.backend.service.RentalAreaService;
import org.sport.backend.service.ServiceItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rental-areas")
@Tag(name = "9. Rental Area")

public class RentalAreaController {

    @Autowired
    private  RentalAreaService rentalAreaService;
    @Autowired
    private ServiceItemService serviceItemService;

    @GetMapping("/{rentalAreaId}/services")
    public ResponseEntity<ApiResponse<List<ServiceItemResponse>>> getServicesByRentalArea(
            @PathVariable UUID rentalAreaId) {

        List<ServiceItemResponse> services = serviceItemService.getByRentalArea(rentalAreaId);
        return ResponseEntity.ok(ApiResponse.success(200, "Success", services));
    }
    @PutMapping("/{rentalAreaId}/approve")
    public ApiResponse<Void> approveRentalArea(@PathVariable UUID rentalAreaId) {
        rentalAreaService.approveRentalArea(rentalAreaId);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Đã phê duyệt cơ sở thành công")
                .build();
    }

    @PutMapping("/{rentalAreaId}/reject")
    public ApiResponse<Void> rejectRentalArea(
            @PathVariable UUID rentalAreaId,
            @RequestBody(required = false) RejectRentalAreaRequest request) {

        String reason = (request != null) ? request.getReason() : null;
        rentalAreaService.rejectRentalArea(rentalAreaId, reason);

        return ApiResponse.<Void>builder()
                .code(200)
                .message("Đã từ chối cơ sở thành công")
                .build();
    }


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    @PreAuthorize("hasAuthority('CREATE_RENTAL_AREA')")
    public ApiResponse<?> createRentalArea(
            @Valid @ModelAttribute RentalAreaRequest request
    ) {
        try {
            List<MultipartFile> images = request.getImages();
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
            @RequestParam(required = false) VerificationStatus verificationStatus,
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
                        verificationStatus,
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
//    @PreAuthorize("isAuthenticated()")
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

    @PutMapping(value = "/{rentalAreaId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('UPDATE_RENTAL_AREA')")
    public ApiResponse<RentalAreaResponse> updateRentalArea(
            @PathVariable UUID rentalAreaId,
            @Valid @ModelAttribute RentalAreaUpdateRequest request
    ) {
        return ApiResponse.success(200,
                "Update rental area successfully",
                rentalAreaService.updateRentalArea(rentalAreaId, request));
    }

    @DeleteMapping("/{rentalAreaId}")
    @PreAuthorize("hasAuthority('DELETE_RENTAL_AREA')")
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
