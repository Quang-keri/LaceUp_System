package org.sport.backend.specification;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

import jakarta.persistence.criteria.Predicate;
import org.sport.backend.dto.request.post.PostFilterRequest;
import org.sport.backend.entity.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
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
            if (filter.getMinRating() != null && filter.getMinRating() > 0) {

                Join<Court, RentalArea> rentalAreaJoin =
                        courtJoin.join("rentalArea", JoinType.INNER);

                Join<RentalArea, Review> reviewJoin =
                        rentalAreaJoin.join("reviews", JoinType.LEFT);

                query.groupBy(root.get("postId"));

                Expression<Double> avgRating =
                        cb.avg(reviewJoin.get("rating"));

                Expression<Double> finalAvgRating = cb.coalesce(avgRating, 0.0);

                query.having(
                        cb.and(
                                cb.greaterThanOrEqualTo(
                                        finalAvgRating,
                                        filter.getMinRating()
                                ),
                                cb.lessThan(
                                        finalAvgRating,
                                        filter.getMinRating() + 1.0
                                )
                        )
                );
            }

            if (filter.getTitle() != null && !filter.getTitle().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + filter.getTitle().toLowerCase() + "%"));
            }


            Join<Court, RentalArea> rentalAreaJoin = null;

            if (
                    (filter.getCityIds() != null && !filter.getCityIds().isEmpty()) ||
                             (filter.getProvinceCodes() != null && !filter.getProvinceCodes().isEmpty()) ||
                             (filter.getWards() != null && !filter.getWards().isEmpty())
            ) {
                rentalAreaJoin = courtJoin.join("rentalArea", JoinType.INNER);
            }

            if (filter.getCityIds() != null && !filter.getCityIds().isEmpty()) {
                predicates.add(
                        rentalAreaJoin
                                .get("address")
                                .get("city")
                                .get("cityId")
                                .in(filter.getCityIds())
                );
            }

            if (filter.getProvinceCodes() != null && !filter.getProvinceCodes().isEmpty()) {
                predicates.add(
                        rentalAreaJoin
                                .get("address")
                                .get("city")
                                .get("provinceCode")
                                .in(filter.getProvinceCodes())
                );
            }

            if (filter.getWards() != null && !filter.getWards().isEmpty()) {
                predicates.add(
                        rentalAreaJoin
                                .get("address")
                                .get("ward")
                                .in(filter.getWards())
                );
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

            if ("price_low".equals(filter.getSortBy()) ||
                    "price_high".equals(filter.getSortBy())) {

                Join<Court, CourtPrice> priceJoin =
                        courtJoin.join("courtPrices", JoinType.LEFT);

                assert query != null;
                query.groupBy(root.get("postId"));

                Expression<BigDecimal> minPrice =
                        cb.min(priceJoin.get("pricePerHour"));

                if ("price_low".equals(filter.getSortBy())) {
                    query.orderBy(cb.asc(minPrice));
                } else {
                    query.orderBy(cb.desc(minPrice));
                }
            }
            if (
                    (filter.getAmenityIds() != null && !filter.getAmenityIds().isEmpty()) ||
                            (filter.getCategoryIds() != null && !filter.getCategoryIds().isEmpty()) ||
                            (filter.getCityIds() != null && !filter.getCityIds().isEmpty())
            ) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}