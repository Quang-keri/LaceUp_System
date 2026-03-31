package org.sport.backend.specification;

import org.sport.backend.constant.VerificationStatus;
import org.sport.backend.entity.RentalArea;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;



import org.sport.backend.constant.RentalAreaStatus;


import java.time.LocalDateTime;


public class RentalAreaSpecification {
    public static Specification<RentalArea> hasVerificationStatus(VerificationStatus verificationStatus) {
        return (root, query, criteriaBuilder) -> {
            if (verificationStatus == null) {
                return null;
            }
            return criteriaBuilder.equal(root.get("verificationStatus"), verificationStatus);
        };
    }
    public static Specification<RentalArea> isNotDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<RentalArea> hasCity(UUID cityId) {
        return (root, query, cb) -> {
            if (cityId == null) return null;
            return cb.equal(root.get("city").get("cityId"), cityId);
        };
    }

    public static Specification<RentalArea> hasStatus(RentalAreaStatus status) {
        return (root, query, cb) -> {
            if (status == null) return null;
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<RentalArea> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;

            String like = "%" + keyword.toLowerCase() + "%";

            return cb.or(
                    cb.like(cb.lower(root.get("rentalAreaName")), like),
                    cb.like(cb.lower(root.get("address")), like)
            );
        };
    }

    public static Specification<RentalArea> ownedBy(UUID userId) {
        return (root, query, cb) -> {
            if (userId == null) return null;
            return cb.equal(root.get("owner").get("userId"), userId);
        };
    }

    public static Specification<RentalArea> fromDate(LocalDateTime from) {
        return (root, query, cb) -> {
            if (from == null) return null;
            return cb.greaterThanOrEqualTo(root.get("createdAt"), from);
        };
    }

    public static Specification<RentalArea> toDate(LocalDateTime to) {
        return (root, query, cb) -> {
            if (to == null) return null;
            return cb.lessThanOrEqualTo(root.get("createdAt"), to);
        };
    }
}
