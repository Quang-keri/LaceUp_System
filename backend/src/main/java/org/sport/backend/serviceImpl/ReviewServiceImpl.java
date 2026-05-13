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

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.*;
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
                    .createdAt(LocalDateTime.now())
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


    @Override
    public Map<String, Object> getReviewStats() {

        Long total = reviewRepository.count();

        Double avg = reviewRepository.getAverageRating();
        if (avg == null) {
            avg = 0.0;
        }

        LocalDateTime now = LocalDateTime.now();

        LocalDateTime startToday =
                now.toLocalDate().atStartOfDay();

        LocalDateTime endToday =
                now.toLocalDate().atTime(23,59,59);

        LocalDateTime startWeek =
                now.with(DayOfWeek.MONDAY)
                        .toLocalDate()
                        .atStartOfDay();

        Long todayCount =
                reviewRepository.countByCreatedAtBetween(
                        startToday,
                        endToday
                );

        Long weekCount =
                reviewRepository.countByCreatedAtBetween(
                        startWeek,
                        now
                );

        Long negativeCount =
                reviewRepository.countByRatingLessThanEqual(2);

        Map<String, Object> result = new HashMap<>();

        result.put("totalReviews", total);

        result.put(
                "averageRating",
                Math.round(avg * 10.0) / 10.0
        );

        result.put("newToday", todayCount);

        result.put("newThisWeek", weekCount);

        result.put("reportedCount", 0);

        result.put("hiddenCount", 0);

        result.put(
                "negativeRate",
                total == 0
                        ? 0
                        : (negativeCount * 100.0 / total)
        );

        result.put("ownerResponseRate", 0);

        return result;
    }

    // Cập nhật hàm getReviews của bạn
    // TRONG TỆP ReviewServiceImpl.java
    @Override
    public PageResponse<ReviewResponse> getReviews(
            int page,
            int size,
            Integer rating,
            String rentalName, // Mới
            String userName,   // Mới
            String address,    // Mới
            String startDate,
            String endDate
    ) {
        List<Review> reviews = reviewRepository.findAll();

        List<Review> filtered = reviews.stream()
                .filter(r -> {
                    if (rating != null && r.getRating() != rating) {
                        return false;
                    }

                    if (userName != null && !userName.isBlank()) {
                        if (r.getUser() == null || r.getUser().getUserName() == null ||
                                !r.getUser().getUserName().toLowerCase().contains(userName.toLowerCase())) {
                            return false;
                        }
                    }

                    if (rentalName != null && !rentalName.isBlank()) {
                        if (r.getRentalArea() == null || r.getRentalArea().getRentalAreaName() == null ||
                                !r.getRentalArea().getRentalAreaName().toLowerCase().contains(rentalName.toLowerCase())) {
                            return false;
                        }
                    }


                    if (address != null && !address.isBlank()) {
                        if (r.getRentalArea() == null || r.getRentalArea().getAddress() == null ||
                                !r.getRentalArea().getAddress().getStreet().toLowerCase().contains(address.toLowerCase())) {
                            return false;
                        }
                    }

                    if (startDate != null && !startDate.isBlank()) {
                        try {
                            String cleanStart = startDate.replace("Z", "").trim();
                            LocalDateTime start = LocalDateTime.parse(cleanStart);
                            if (r.getCreatedAt().isBefore(start)) return false;
                        } catch (Exception ignored) {}
                    }

                    if (endDate != null && !endDate.isBlank()) {
                        try {
                            String cleanEnd = endDate.replace("Z", "").trim();
                            LocalDateTime end = LocalDateTime.parse(cleanEnd);
                            if (r.getCreatedAt().isAfter(end)) return false;
                        } catch (Exception ignored) {}
                    }

                    return true;
                })
                .collect(Collectors.toList());

        int totalElements = filtered.size();
        int from = Math.min(page * size, totalElements);
        int to = Math.min(from + size, totalElements);

        List<ReviewResponse> data = filtered.subList(from, to)
                .stream()
                .map(this::mapToResponseDashboard)
                .collect(Collectors.toList());

        int totalPages = (int) Math.ceil((double) totalElements / size);

        return PageResponse.<ReviewResponse>builder()
                .currentPage(page + 1)
                .pageSize(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .data(data)
                .build();
    }


    private ReviewResponse mapToResponseDashboard(Review review) {
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .userName(review.getUser() != null ? review.getUser().getUserName() : "")
                .rentalName(review.getRentalArea() != null ? review.getRentalArea().getRentalAreaName() : "")
                .address(review.getRentalArea() != null ? review.getRentalArea().getAddress().getStreet() + " "+review.getRentalArea().getAddress().getCityName() : "")
                .build();
    }


}
