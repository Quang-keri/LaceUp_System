package org.sport.backend.specification;

import jakarta.persistence.criteria.Predicate;
import org.sport.backend.entity.User;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<User> filterUsers(String keyword, String role, Boolean active) {
        return (root, query, criteriaBuilder) -> {

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
}
