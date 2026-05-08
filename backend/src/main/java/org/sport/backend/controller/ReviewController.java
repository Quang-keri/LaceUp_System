package org.sport.backend.controller;



import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.review.ReviewRequest;
import org.sport.backend.dto.response.review.ReviewResponse;
import org.sport.backend.service.ReviewService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/reviews") // Cấu hình tiền tố phù hợp với config Axios bên FE
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;


    @GetMapping("/rental/{rentalId}")
    public ApiResponse<PageResponse<ReviewResponse>> getReviewsByRentalArea(
            @PathVariable UUID rentalId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<ReviewResponse> pageResponse = reviewService.getReviewsByRentalArea(rentalId, page, size);
        return ApiResponse.success(pageResponse);
    }


    @GetMapping("/me/rental/{rentalId}")
    public ApiResponse<ReviewResponse> getMyReview(
            @PathVariable UUID rentalId,
            Principal principal) {


        if (principal == null) {
            return ApiResponse.success(null);
        }

        ReviewResponse response = reviewService.getMyReview(rentalId, principal.getName());
        return ApiResponse.success(response);
    }


    @GetMapping("/check-eligibility/{rentalId}")
    public ApiResponse<Boolean> checkEligibility(
            @PathVariable UUID rentalId,
            Principal principal) {


        if (principal == null) {
            return ApiResponse.success(false);
        }
        System.err.println("Checking eligibility for user: " + principal.getName() + " and rentalId: " + rentalId);
        boolean isEligible = reviewService.checkEligibility(rentalId, principal.getName());
        return ApiResponse.success(isEligible);
    }


    @PostMapping("/rental/{rentalId}")
    public ApiResponse<String> submitReview(
            @PathVariable UUID rentalId,
            @RequestBody ReviewRequest request,
            Principal principal) {

        if (principal == null) {
            throw new RuntimeException("Vui lòng đăng nhập để đánh giá.");
        }

        reviewService.submitReview(rentalId, request, principal.getName());
        return ApiResponse.success("Đánh giá thành công");
    }
}