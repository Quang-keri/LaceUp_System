//package org.sport.backend.specification;
//
//import org.springframework.data.jpa.domain.Specification;
//
//import java.time.LocalDateTime;
//import java.util.ArrayList;
//import java.util.List;
//import java.util.function.Predicate;
//
//public class SearchItemSpecification {
//
//    public static <T> Specification<T> hasLike(String field, String value) {
//        return (root, query, cb) -> {
//            if (value == null || value.isBlank()) return null;
//            return cb.like(cb.lower(root.get(field)), "%" + value.toLowerCase() + "%");
//        };
//    }
//
//    public static <T> Specification<T> betweenDates(String field, LocalDateTime from, LocalDateTime to) {
//        return (root, query, cb) -> {
//            List<Predicate> predicates = new ArrayList<>();
//            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get(field), from));
//            if (to != null) predicates.add(cb.lessThanOrEqualTo(root.get(field), to));
//            return cb.and(predicates.toArray(new Predicate[0]));
//        };
//    }
//}
