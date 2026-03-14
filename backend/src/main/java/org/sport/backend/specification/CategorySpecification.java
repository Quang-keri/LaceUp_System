package org.sport.backend.specification;

import jakarta.persistence.criteria.Predicate;
import org.sport.backend.entity.Category;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CategorySpecification {

    public static Specification<Category> filter(
            String keyword,
            LocalDateTime from,
            LocalDateTime to
    ) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                predicates.add(
                        cb.like(
                                cb.lower(root.get("categoryName")),
                                "%" + keyword.toLowerCase() + "%"
                        )
                );
            }

            if (from != null) {
                predicates.add(
                        cb.greaterThanOrEqualTo(root.get("createdAt"), from)
                );
            }

            if (to != null) {
                predicates.add(
                        cb.lessThanOrEqualTo(root.get("createdAt"), to)
                );
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}