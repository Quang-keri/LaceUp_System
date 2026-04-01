package org.sport.backend.controller;

import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.legal.LegalProfileRequest;
import org.sport.backend.dto.response.legal.LegalProfileResponse;
import org.sport.backend.service.LegalProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/legal-profiles")
public class LegalProfileController {

    @Autowired
    private LegalProfileService legalProfileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<LegalProfileResponse> createLegalProfile(@ModelAttribute LegalProfileRequest request) {
        LegalProfileResponse response = legalProfileService.create(request);
        return ApiResponse.success(201, "Legal profile created successfully", response);
    }

    @PutMapping(value = "/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<LegalProfileResponse> updateLegalProfile(
            @PathVariable UUID id,
            @ModelAttribute LegalProfileRequest request) {
        LegalProfileResponse response = legalProfileService.update(id, request);
        return ApiResponse.success(200, "Updated Legal profile successfully", response);
    }

    @GetMapping("/{id}")
    public ApiResponse<LegalProfileResponse> getLegalProfile(@PathVariable UUID id) {
        LegalProfileResponse response = legalProfileService.get(id);
        return ApiResponse.success(200, "Get Legal profile successfully", response);
    }

    @GetMapping
    public ApiResponse<List<LegalProfileResponse>> getAllLegalProfiles() {
        List<LegalProfileResponse> responses = legalProfileService.getAll();
        return ApiResponse.success(200,"Get all legal profile successfully",responses);
    }
}
