package org.sport.backend.controller;

import jakarta.validation.Valid;
import org.sport.backend.base.ApiResponse;

import org.sport.backend.dto.request.court_copy.CourtCopyRequest;
import org.sport.backend.service.CourtCopyService;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("court_copies")
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
}
