package org.sport.backend.service;

import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.review.ReviewRequest;
import org.sport.backend.dto.response.review.ReviewResponse;

import java.util.Map;
import java.util.UUID;

public interface ReviewService {

    PageResponse<ReviewResponse> getReviewsByRentalArea(
            UUID rentalAreaId,
            int page,
            int size
    );

    ReviewResponse getMyReview(UUID rentalAreaId, String username);

    boolean checkEligibility(UUID rentalAreaId, String username);

    void submitReview(UUID rentalAreaId, ReviewRequest request, String username);


    Map<String, Object> getReviewStats();

    PageResponse<ReviewResponse> getReviews(
            int page, int size, Integer rating,
            String rentalName,
            String userName,
            String address,
            String startDate, String endDate
    );
}
