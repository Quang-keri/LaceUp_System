package org.sport.backend.specification;

import org.sport.backend.constant.NewsVisibility;
import org.sport.backend.entity.News;
import org.sport.backend.entity.User;
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

    public static Specification<News> getNewsByVisibility(User currentUser) {
        return (root, query, cb) -> {

            // Admins see all
            if (currentUser != null && currentUser.getRole() != null
                    && "ADMIN".equalsIgnoreCase(currentUser.getRole().getRoleName())) {
                return cb.conjunction();
            }

            // Authenticated users see PUBLIC and MEMBER
            if (currentUser != null) {
                return root.get("visibility").in(NewsVisibility.PUBLIC, NewsVisibility.MEMBER);
            }

            // Anonymous users see only PUBLIC
            return cb.equal(root.get("visibility"), NewsVisibility.PUBLIC);
        };
    }
}
