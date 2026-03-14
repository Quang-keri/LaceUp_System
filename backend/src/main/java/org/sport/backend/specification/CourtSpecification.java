package org.sport.backend.specification;

import org.sport.backend.constant.CourtStatus;
import org.sport.backend.entity.Court;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.UUID;

public class CourtSpecification {


    public static Specification<Court> hasStatus(CourtStatus status) {
        return (root, query, cb) -> {
            if (status == null) return null;
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Court> hasKeyword(String keyword) {

        return (root, query, cb) -> {

            if (keyword == null || keyword.isBlank()) return null;

            String like = "%" + keyword.toLowerCase() + "%";

            return cb.like(cb.lower(root.get("courtName")), like);
        };
    }

    public static Specification<Court> ownedBy(UUID ownerId) {

        return (root, query, cb) -> {

            if (ownerId == null) return null;

            return cb.equal(
                    root.get("rentalArea").get("owner").get("userId"),
                    ownerId
            );
        };
    }

    public static Specification<Court> fromDate(LocalDateTime fromDate) {

        return (root, query, cb) -> {

            if (fromDate == null) return null;

            return cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate);
        };
    }

    public static Specification<Court> toDate(LocalDateTime toDate) {

        return (root, query, cb) -> {

            if (toDate == null) return null;

            return cb.lessThanOrEqualTo(root.get("createdAt"), toDate);
        };
    }

    public static Specification<Court> byRentalArea(UUID rentalAreaId) {

        return (root, query, cb) -> {

            if (rentalAreaId == null) return null;

            return cb.equal(root.get("rentalArea").get("rentalAreaId"), rentalAreaId);
        };
    }

}
