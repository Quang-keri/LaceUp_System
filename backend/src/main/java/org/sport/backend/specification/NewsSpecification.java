package org.sport.backend.specification;

import org.sport.backend.entity.News;
import org.springframework.data.jpa.domain.Specification;

public class NewsSpecification {

    public static Specification<News> search(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;

            String like = "%" + keyword.toLowerCase() + "%";

            return cb.or(
                    cb.like(cb.lower(root.get("title")), like),
                    cb.like(cb.lower(root.get("content")), like)
            );
        };
    }
}
