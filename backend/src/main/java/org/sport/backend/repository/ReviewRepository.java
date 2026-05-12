package org.sport.backend.repository;

import org.sport.backend.entity.RentalArea;
import org.sport.backend.entity.Review;
import org.sport.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID>, JpaSpecificationExecutor<Review> {
    Optional<Review> findReviewByUserAndRentalArea(User user, RentalArea rentalArea);
    Page<Review> findByRentalArea_RentalAreaIdOrderByCreatedAtDesc(
            UUID rentalArea_rentalAreaId, Pageable pageable
    );

    @org.springframework.data.jpa.repository.Query("SELECT AVG(r.rating) FROM Review r")
    Double getAverageRating();

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Review r WHERE r.createdAt >= :from AND r.createdAt <= :to")
    Long countByCreatedAtBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Review r WHERE r.rating <= :maxRating")
    Long countByRatingLessThanEqual(int maxRating);
}