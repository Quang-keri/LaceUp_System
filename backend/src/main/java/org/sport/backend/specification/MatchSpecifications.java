package org.sport.backend.specification;

import jakarta.persistence.criteria.Fetch;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.entity.Match;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class MatchSpecifications {

    public static Specification<Match> hasStatus(MatchStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Match> hasCategory(String categoryName) {
        return (root, query, cb) -> {
            if (categoryName == null || categoryName.isEmpty()) return null;
            // Dùng join để filter
            return cb.equal(root.join("court").join("category").get("categoryName"), categoryName);
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
            if (keyword == null || keyword.isEmpty()) return null;
            return cb.like(cb.lower(root.join("court").get("courtName")), "%" + keyword.toLowerCase() + "%");
        };
    }

    /**
     * Quan trọng: Fetch dữ liệu liên quan để tránh N+1 query và Lazy loading error
     */
    public static Specification<Match> fetchAllDetails() {
        return (root, query, cb) -> {
            // Chỉ fetch khi query trả về Match entity (tránh lỗi khi Spring Data JPA gọi count query để phân trang)
            if (Long.class != query.getResultType()) {
                root.fetch("court", JoinType.LEFT).fetch("category", JoinType.LEFT);
                root.fetch("host", JoinType.LEFT);
                // Fetch luôn danh sách đăng ký và user trong đó để mapper lấy participants
                Fetch<Object, Object> registrations = root.fetch("registrations", JoinType.LEFT);
                registrations.fetch("user", JoinType.LEFT);

                query.distinct(true); // Đảm bảo không bị lặp bản ghi do fetch join OneToMany
            }
            return null;
        };
    }
}