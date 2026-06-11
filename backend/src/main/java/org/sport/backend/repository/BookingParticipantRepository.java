package org.sport.backend.repository;

import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.entity.BookingParticipant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingParticipantRepository
        extends JpaRepository<BookingParticipant, UUID> {

    List<BookingParticipant> findAllByBooking_BookingId(UUID bookingId);

    Optional<BookingParticipant>
    findTopByBooking_BookingIdAndUser_UserIdOrderByCreatedAtDesc(
            UUID bookingId,
            UUID userId
    );

    @Query("""
            SELECT COALESCE(SUM(bp.quantity), 0)
            FROM BookingParticipant bp
            WHERE bp.booking.bookingId = :bookingId
              AND bp.paymentStatus IN :statuses
            """)
    Long sumQuantityByBookingIdAndStatuses(
            @Param("bookingId") UUID bookingId,
            @Param("statuses") Collection<PaymentStatus> statuses
    );

    @Query("""
            SELECT COALESCE(SUM(bp.amountPaid), 0)
            FROM BookingParticipant bp
            WHERE bp.booking.bookingId = :bookingId
              AND bp.paymentStatus IN :statuses
              AND (bp.isHost = false OR bp.isHost IS NULL)
            """)
    BigDecimal sumAmountByBookingIdAndStatuses(
            @Param("bookingId") UUID bookingId,
            @Param("statuses") Collection<PaymentStatus> statuses
    );

    @Query("""
            SELECT bp
            FROM BookingParticipant bp
            WHERE bp.paymentStatus = :status
              AND bp.createdAt <= :expireTime
            """)
    List<BookingParticipant> findPendingTicketsOlderThan(
            @Param("status") PaymentStatus status,
            @Param("expireTime") LocalDateTime expireTime
    );

    @Query("""
            SELECT participant
            FROM BookingParticipant participant
            JOIN participant.booking booking
            WHERE booking.rentalArea.rentalAreaId = :rentalAreaId
              AND participant.paymentStatus = 'PENDING'
              AND participant.paymentProofUrl IS NOT NULL
              AND (
                    :hasFrom = false
                    OR booking.startTime >= :fromTime
              )
              AND (
                    :hasTo = false
                    OR booking.endTime < :toTimeExclusive
              )
            ORDER BY participant.paymentProofUploadedAt DESC
            """)
    Page<BookingParticipant> findPendingTicketsForOwner(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("hasFrom") boolean hasFrom,
            @Param("fromTime") LocalDateTime fromTime,
            @Param("hasTo") boolean hasTo,
            @Param("toTimeExclusive") LocalDateTime toTimeExclusive,
            Pageable pageable
    );

    @Query("""
            SELECT participant
            FROM BookingParticipant participant
            JOIN FETCH participant.user
            WHERE participant.booking.bookingId = :bookingId
              AND participant.paymentStatus IN :statuses
            ORDER BY participant.createdAt ASC
            """)
    List<BookingParticipant> findActiveParticipantsByBookingId(
            @Param("bookingId") UUID bookingId,
            @Param("statuses") Collection<PaymentStatus> statuses
    );

}
