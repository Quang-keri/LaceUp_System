package org.sport.backend.serviceImpl;

import org.sport.backend.constant.BookingStatus;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.review.ReviewRequest;
import org.sport.backend.dto.response.review.ReviewResponse;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.entity.Review;
import org.sport.backend.entity.User;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.repository.RentalAreaRepository;
import org.sport.backend.repository.ReviewRepository;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.ReviewService;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final RentalAreaRepository rentalAreaRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @Override
    public PageResponse<ReviewResponse> getReviewsByRentalArea(UUID rentalAreaId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviewPage = reviewRepository.findByRentalArea_RentalAreaIdOrderByCreatedAtDesc(rentalAreaId, pageable);

        List<ReviewResponse> reviewResponses = reviewPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(reviewPage, reviewResponses);
    }

    @Override
    public ReviewResponse getMyReview(UUID rentalAreaId, String username) {
        User user = getUserByUsername(username);
        RentalArea rentalArea = getRentalAreaById(rentalAreaId);

        return reviewRepository.findReviewByUserAndRentalArea(user, rentalArea)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    public boolean checkEligibility(UUID rentalAreaId, String username) {
        User user = getUserByUsername(username);
        RentalArea rentalArea = getRentalAreaById(rentalAreaId);

        boolean byUser = bookingRepository.existsByRenterAndRentalAreaAndBookingStatus(
            user,
            rentalArea,
            BookingStatus.COMPLETED
        );

        boolean byPhone = false;
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            byPhone = bookingRepository.existsByBookerPhoneAndRentalAreaAndBookingStatus(
                user.getPhone(),
                rentalArea,
                BookingStatus.COMPLETED
            );
        }

        return byUser || byPhone;
    }

    @Override
    @Transactional
    public void submitReview(UUID rentalAreaId, ReviewRequest request, String mail) {
        User user = getUserByUsername(mail);
        RentalArea rentalArea = getRentalAreaById(rentalAreaId);

        if (!checkEligibility(rentalAreaId, mail)) {
            throw new RuntimeException("Bạn phải trải nghiệm sân này trước khi đánh giá.");
        }

        Optional<Review> existingReviewOpt = reviewRepository.findReviewByUserAndRentalArea(user, rentalArea);

        if (existingReviewOpt.isPresent()) {
            Review existingReview = existingReviewOpt.get();
            existingReview.setRating(request.getRating());
            existingReview.setComment(request.getComment());
            reviewRepository.save(existingReview);
        } else {
            Review newReview = Review.builder()
                    .user(user)
                    .rentalArea(rentalArea)
                    .rating(request.getRating())
                    .comment(request.getComment())
                    .build();
            reviewRepository.save(newReview);
        }
    }


    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .userName(review.getUser().getUserName())
                .build();
    }

    private User getUserByUsername(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
    }

    private RentalArea getRentalAreaById(UUID rentalAreaId) {
        return rentalAreaRepository.findById(rentalAreaId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khu vực sân."));
    }
}
