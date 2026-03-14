package org.sport.backend.specification;

import org.sport.backend.entity.Post;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class PostSpecification {

    public static Specification<Post> hasTitle(String title) {

        return (root, query, cb) -> {

            if (title == null || title.isBlank()) return null;

            return cb.like(
                    cb.lower(root.get("title")),
                    "%" + title.toLowerCase() + "%"
            );
        };
    }

    public static Specification<Post> hasContent(String content) {

        return (root, query, cb) -> {

            if (content == null || content.isBlank()) return null;

            return cb.like(
                    cb.lower(root.get("description")),
                    "%" + content.toLowerCase() + "%"
            );
        };
    }

    public static Specification<Post> fromDate(LocalDate fromDate) {

        return (root, query, cb) -> {

            if (fromDate == null) return null;

            return cb.greaterThanOrEqualTo(
                    root.get("createdAt"),
                    fromDate.atStartOfDay()
            );
        };
    }

    public static Specification<Post> toDate(LocalDate toDate) {

        return (root, query, cb) -> {

            if (toDate == null) return null;

            return cb.lessThanOrEqualTo(
                    root.get("createdAt"),
                    toDate.atTime(23,59,59)
            );
        };
    }

}