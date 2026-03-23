package org.sport.backend.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

import jakarta.persistence.criteria.Predicate;
import org.sport.backend.dto.request.post.PostFilterRequest;
import org.sport.backend.entity.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;


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
    public static Specification<Post> filterByCriteria(PostFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();


            Join<Post, Court> courtJoin = root.join("court", JoinType.INNER);


            if (filter.getTitle() != null && !filter.getTitle().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + filter.getTitle().toLowerCase() + "%"));
            }


            if (filter.getCityIds() != null && !filter.getCityIds().isEmpty()) {
                Join<Court, RentalArea> rentalAreaJoin = courtJoin.join("rentalArea", JoinType.INNER);
                Join<RentalArea, City> cityJoin = rentalAreaJoin.join("city", JoinType.INNER);
                predicates.add(cityJoin.get("cityId").in(filter.getCityIds()));
            }


            if (filter.getCategoryIds() != null && !filter.getCategoryIds().isEmpty()) {
                Join<Court, Category> categoryJoin = courtJoin.join("category", JoinType.INNER);
                predicates.add(categoryJoin.get("categoryId").in(filter.getCategoryIds())); // Sửa lại tên field ID cho đúng với Entity Category của bạn
            }


            if (filter.getAmenityIds() != null && !filter.getAmenityIds().isEmpty()) {
                Join<Court, Amenity> amenityJoin = courtJoin.join("amenities", JoinType.INNER);
                predicates.add(amenityJoin.get("amenityId").in(filter.getAmenityIds())); // Sửa lại field ID cho đúng Entity
            }


            if (filter.getMinPrice() != null || filter.getMaxPrice() != null) {
                Join<Court, CourtPrice> priceJoin = courtJoin.join("courtPrices", JoinType.INNER);

                if (filter.getMinPrice() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(priceJoin.get("pricePerHour"), filter.getMinPrice()));
                }
                if (filter.getMaxPrice() != null) {
                    predicates.add(cb.lessThanOrEqualTo(priceJoin.get("pricePerHour"), filter.getMaxPrice()));
                }
            }


            query.distinct(true);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}