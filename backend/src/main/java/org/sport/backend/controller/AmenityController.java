package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.amenity.CreateAmenityRequest;
import org.sport.backend.dto.request.amenity.UpdateAmenityRequest;
import org.sport.backend.dto.response.amenity.AmenityResponse;
import org.sport.backend.service.AmenityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/amenities")
@Tag(name = "8. Amenity")
public class AmenityController {

    @Autowired
    private AmenityService amenityService;

    @PostMapping
    public ApiResponse<AmenityResponse> createAmenity(
            @Valid @RequestBody CreateAmenityRequest request
    ) {
        AmenityResponse result = amenityService.createAmenity(request);


        return ApiResponse.<AmenityResponse>builder()
                .code(200)
                .message("Create amenity successfully")
                .result(result)
                .build();
    }

    @PutMapping("/{amenityId}")
    public ApiResponse<AmenityResponse> updateAmenity(
            @PathVariable Long amenityId,
            @Valid @RequestBody UpdateAmenityRequest request
    ) {
        AmenityResponse result = amenityService.updateAmenity(amenityId, request);


        return ApiResponse.<AmenityResponse>builder()
                .code(200)
                .message("Update amenity successfully")
                .result(result)
                .build();
    }

    @DeleteMapping("/{amenityId}")
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
        AmenityResponse result = amenityService.getAmenityById(amenityId);


        return ApiResponse.<AmenityResponse>builder()
                .code(200)
                .message("Get amenity successfully")
                .result(result)
                .build();
    }

    @GetMapping
    public ApiResponse<List<AmenityResponse>> getAllAmenities() {
        List<AmenityResponse> result = amenityService.getAllAmenities();


        return ApiResponse.<List<AmenityResponse>>builder()
                .code(200)
                .message("Get all amenities successfully")
                .result(result)
                .build();
    }

}
