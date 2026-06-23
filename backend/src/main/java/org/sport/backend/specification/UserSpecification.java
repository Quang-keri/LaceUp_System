package org.sport.backend.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.sport.backend.constant.MemberTier;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.User;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class UserSpecification {

    public static Specification<User> filterUsers(String keyword, String role, Boolean active) {
        return (root, query, criteriaBuilder) -> {

            assert query != null;
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("extraPermissions", jakarta.persistence.criteria.JoinType.LEFT);
            }

            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String searchPattern = "%" + keyword.toLowerCase() + "%";
                Predicate userNameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("userName")), searchPattern);
                Predicate emailLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern);
                predicates.add(criteriaBuilder.or(userNameLike, emailLike));
            }

            if (StringUtils.hasText(role)) {
                predicates.add(criteriaBuilder.equal(root.join("role").get("roleName"), role));
            }

            if (active != null) {
                predicates.add(criteriaBuilder.equal(root.get("active"), active));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<User> filterCustomers(String keyword, MemberTier tier, Integer minScore, Integer maxScore, UUID ownerId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String searchPattern = "%" + keyword.toLowerCase() + "%";
                Predicate userNameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("userName")), searchPattern);
                Predicate phoneLike = criteriaBuilder.like(root.get("phone"), searchPattern);
                predicates.add(criteriaBuilder.or(userNameLike, phoneLike));
            }

            if (tier != null) {
                predicates.add(criteriaBuilder.equal(root.get("memberTier"), tier));
            }

            if (minScore != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("creditScore"), minScore));
            }
            if (maxScore != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("creditScore"), maxScore));
            }

            if (ownerId != null) {
                assert query != null;

                Subquery<UUID> bookingSubquery = query.subquery(UUID.class);
                Root<Booking> bookingRoot = bookingSubquery.from(Booking.class);
                bookingSubquery.select(bookingRoot.join("renter").get("userId"))
                        .where(criteriaBuilder.equal(bookingRoot.join("rentalArea").join("owner").get("userId"), ownerId));

                Subquery<UUID> matchSubquery = query.subquery(UUID.class);
                Root<MatchRegistration> matchRegRoot = matchSubquery.from(MatchRegistration.class);
                matchSubquery.select(matchRegRoot.join("user").get("userId"))
                        .where(criteriaBuilder.equal(matchRegRoot.join("match").join("court").join("rentalArea").join("owner").get("userId"), ownerId));

                predicates.add(criteriaBuilder.or(
                        root.get("userId").in(bookingSubquery),
                        root.get("userId").in(matchSubquery)
                ));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
