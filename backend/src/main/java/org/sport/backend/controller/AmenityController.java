package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.amenity.CreateAmenityRequest;
import org.sport.backend.dto.request.amenity.UpdateAmenityRequest;
import org.sport.backend.dto.response.amenity.AmenityResponse;
import org.sport.backend.service.AmenityService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/amenities")
@Tag(name = "8. Amenity")
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityService amenityService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_AMENITY')")
    public ApiResponse<AmenityResponse> createAmenity(
            @Valid @RequestBody CreateAmenityRequest request
    ) {
        return ApiResponse.<AmenityResponse>builder()
                .code(200)
                .message("Create amenity successfully")
                .result(amenityService.createAmenity(request))
                .build();
    }

    @PutMapping("/{amenityId}")
    @PreAuthorize("hasAuthority('UPDATE_AMENITY')")
    public ApiResponse<AmenityResponse> updateAmenity(
            @PathVariable Long amenityId,
            @Valid @RequestBody UpdateAmenityRequest request
    ) {
        return ApiResponse.<AmenityResponse>builder()
                .code(200)
                .message("Update amenity successfully")
                .result(amenityService.updateAmenity(amenityId, request))
                .build();
    }

    @DeleteMapping("/{amenityId}")
    @PreAuthorize("hasAuthority('DELETE_AMENITY')")
    public ApiResponse<Void> deleteAmenity(
            @PathVariable Long amenityId
    ) {
        amenityService.deleteAmenity(amenityId);
        return ApiResponse.<Void>builder()
                .code(200)
                .message("Delete amenity successfully")
                .build();
    }

    @GetMapping("/{amenityId}")
    public ApiResponse<AmenityResponse> getAmenityById(
            @PathVariable Long amenityId
    ) {
        return ApiResponse.<AmenityResponse>builder()
                .code(200)
                .message("Get amenity successfully")
                .result(amenityService.getAmenityById(amenityId))
                .build();
    }

    @GetMapping
    public ApiResponse<List<AmenityResponse>> getAllAmenities() {
        return ApiResponse.<List<AmenityResponse>>builder()
                .code(200)
                .message("Get all amenities successfully")
                .result(amenityService.getAllAmenities())
                .build();
    }

}
