package org.sport.backend.specification;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.BookingType;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.BookingParticipant;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class BookingSpecification {

    private BookingSpecification() {
    }

    public static Specification<Booking> filterBooking(
            UUID rentalId,
            UUID userId,
            BookingStatus status,
            BookingType bookingType,
            String keyword,
            LocalDate from,
            LocalDate to
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = buildCommonPredicates(
                    root,
                    cb,
                    rentalId,
                    status,
                    bookingType,
                    keyword,
                    from,
                    to
            );

            if (userId != null) {
                predicates.add(
                        cb.equal(
                                root.get("renter").get("userId"),
                                userId
                        )
                );
            }

            return cb.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }

    public static Specification<Booking> filterMyBookings(
            UUID userId,
            BookingStatus status,
            BookingType bookingType,
            String keyword,
            LocalDate from,
            LocalDate to
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = buildCommonPredicates(
                    root,
                    cb,
                    null,
                    status,
                    bookingType,
                    keyword,
                    from,
                    to
            );

            Predicate directBookingPredicate = cb.equal(
                    root.get("renter").get("userId"),
                    userId
            );

            assert query != null;
            Subquery<UUID> participantSubquery =
                    query.subquery(UUID.class);

            Root<BookingParticipant> participantRoot =
                    participantSubquery.from(
                            BookingParticipant.class
                    );

            participantSubquery.select(
                    participantRoot
                            .get("booking")
                            .get("bookingId")
            );

            participantSubquery.where(
                    cb.equal(
                            participantRoot
                                    .get("booking")
                                    .get("bookingId"),
                            root.get("bookingId")
                    ),
                    cb.equal(
                            participantRoot
                                    .get("user")
                                    .get("userId"),
                            userId
                    )
            );

            Predicate joinedSharedBookingPredicate =
                    cb.exists(participantSubquery);

            predicates.add(
                    cb.or(
                            directBookingPredicate,
                            joinedSharedBookingPredicate
                    )
            );

            return cb.and(
                    predicates.toArray(new Predicate[0])
            );
        };
    }

    private static List<Predicate> buildCommonPredicates(
            Root<Booking> root,
            CriteriaBuilder cb,
            UUID rentalId,
            BookingStatus status,
            BookingType bookingType,
            String keyword,
            LocalDate from,
            LocalDate to
    ) {
        List<Predicate> predicates = new ArrayList<>();

        if (rentalId != null) {
            predicates.add(
                    cb.equal(
                            root.get("rentalArea")
                                    .get("rentalAreaId"),
                            rentalId
                    )
            );
        }

        if (status != null) {
            predicates.add(
                    cb.equal(
                            root.get("bookingStatus"),
                            status
                    )
            );
        }

        if (bookingType != null) {
            predicates.add(
                    cb.equal(
                            root.get("bookingType"),
                            bookingType
                    )
            );
        }

        if (keyword != null && !keyword.isBlank()) {
            String normalizedKeyword =
                    "%" + keyword.trim().toLowerCase() + "%";

            Predicate namePredicate = cb.like(
                    cb.lower(root.get("bookerName")),
                    normalizedKeyword
            );

            Predicate phonePredicate = cb.like(
                    cb.lower(root.get("bookerPhone")),
                    normalizedKeyword
            );

            predicates.add(
                    cb.or(
                            namePredicate,
                            phonePredicate
                    )
            );
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

        return predicates;
    }
}