package org.sport.backend.specification;

import jakarta.persistence.criteria.Fetch;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.constant.MatchType;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.MatchRegistration;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.UUID;

public class MatchSpecifications {

    public static Specification<Match> hasStatus(MatchStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Match> hasCategory(String categoryName) {
        return (root, query, cb) -> {
            if (categoryName == null || categoryName.isEmpty()) return null;
            return cb.equal(root.join("category", JoinType.LEFT).get("categoryName"), categoryName);
        };
    }

    public static Specification<Match> isWithinTimeRange(LocalDateTime start, LocalDateTime end) {
        return (root, query, cb) -> {
            if (start == null || end == null) return null;
            return cb.between(root.get("startTime"), start, end);
        };
    }

    public static Specification<Match> searchByCourtName(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) return null;
            String likeKeyword = "%" + keyword.toLowerCase() + "%";

            Join<Object, Object> courtJoin = root.join("court", JoinType.LEFT);
            Predicate matchCourtName = cb.like(cb.lower(courtJoin.get("courtName")), likeKeyword);

            Predicate matchStreet = cb.like(cb.lower(root.get("address").get("street")), likeKeyword);

            return cb.or(matchCourtName, matchStreet);
        };
    }

    public static Specification<Match> hasCity(String city) {
        return (root, query, cb) -> {
            if (city == null || city.trim().isEmpty()) return null;
            return cb.like(cb.lower(root.get("address").get("city").get("cityName")), "%" + city.toLowerCase() + "%");
        };
    }

    public static Specification<Match> hasDistrict(String district) {
        return (root, query, cb) -> {
            if (district == null || district.trim().isEmpty()) return null;
            return cb.like(cb.lower(root.get("address").get("district")), "%" + district.toLowerCase() + "%");
        };
    }

    public static Specification<Match> hasWard(String ward) {
        return (root, query, cb) -> {
            if (ward == null || ward.trim().isEmpty()) return null;
            return cb.like(cb.lower(root.get("address").get("ward")), "%" + ward.toLowerCase() + "%");
        };
    }

    public static Specification<Match> fetchAllDetails() {
        return (root, query, cb) -> {
            if (Long.class != query.getResultType()) {
                root.fetch("court", JoinType.LEFT).fetch("category", JoinType.LEFT);
                root.fetch("host", JoinType.LEFT);
                Fetch<Object, Object> registrations = root.fetch("registrations", JoinType.LEFT);
                registrations.fetch("user", JoinType.LEFT);

                query.distinct(true);
            }
            return null;
        };
    }

    public static Specification<Match> hasMatchType(MatchType matchType) {
        return (root, query, criteriaBuilder) -> {
            if (matchType == null) {
                return null;
            }
            return criteriaBuilder.equal(root.get("matchType"), matchType);
        };
    }

    public static Specification<Match> isParticipantOrHost(UUID userId) {
        return (root, query, cb) -> {
            if (userId == null) return null;

            Predicate isHost = cb.equal(root.join("host", JoinType.LEFT).get("userId"), userId);

            Join<Match, MatchRegistration> registrationsJoin = root.join("registrations", JoinType.LEFT);
            Predicate isParticipant = cb.equal(registrationsJoin.join("user", JoinType.LEFT).get("userId"), userId);

            return cb.or(isHost, isParticipant);
        };
    }
}