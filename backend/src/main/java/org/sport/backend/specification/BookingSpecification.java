package org.sport.backend.specification;

import jakarta.persistence.criteria.Predicate;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.entity.Booking;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class BookingSpecification {

    public static Specification<Booking> filterBooking(
            UUID rentalId,
            UUID userId,
            BookingStatus status,
            String keyword,
            LocalDate from,
            LocalDate to
    ) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            if (rentalId != null) {
                predicates.add(
                        cb.equal(root.get("rentalArea").get("rentalAreaId"), rentalId)
                );
            }

            if (userId != null) {
                predicates.add(
                        cb.equal(root.get("renter").get("userId"), userId)
                );
            }

            if (status != null) {
                predicates.add(
                        cb.equal(root.get("bookingStatus"), status)
                );
            }

            if (keyword != null && !keyword.isBlank()) {

                Predicate name = cb.like(
                        cb.lower(root.get("bookerName")),
                        "%" + keyword.toLowerCase() + "%"
                );

                Predicate phone = cb.like(
                        cb.lower(root.get("bookerPhone")),
                        "%" + keyword.toLowerCase() + "%"
                );

                predicates.add(cb.or(name, phone));
            }

            if (from != null) {
                predicates.add(
                        cb.greaterThanOrEqualTo(
                                root.get("startTime"),
                                from.atStartOfDay()
                        )
                );
            }

            if (to != null) {
                predicates.add(
                        cb.lessThanOrEqualTo(
                                root.get("endTime"),
                                to.atTime(23, 59, 59)
                        )
                );
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
