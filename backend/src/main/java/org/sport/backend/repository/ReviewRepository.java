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
}