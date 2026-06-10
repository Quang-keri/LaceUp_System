package org.sport.backend.repository;

import jakarta.persistence.LockModeType;
import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.BookingParticipant;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    @Query("SELECT p.paymentStatus, COUNT(p) FROM Payment p " +
            "WHERE p.transactionDate BETWEEN :startDate AND :endDate " +
            "AND (:ownerId IS NULL OR p.booking.rentalArea.owner.userId = :ownerId) " +
            "GROUP BY p.paymentStatus")
    List<Object[]> countByPaymentStatus(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("ownerId") UUID ownerId
    );

    Optional<Payment> findFirstByBookingOrderByTransactionDateDesc(Booking booking);

    Optional<Payment> findByOrderCode(Long orderCode);

    @Query("""
                SELECT COALESCE(SUM(p.amount), 0)
                FROM Payment p
                WHERE p.paymentType = org.sport.backend.constant.PaymentType.MATCH_JOIN
                  AND p.paymentStatus = org.sport.backend.constant.PaymentStatus.SUCCESS
                  AND p.matchRegistration.match.court.rentalArea.rentalAreaId = :rentalAreaId
                  AND CAST(p.matchRegistration.match.startTime AS date) = :date
                  AND p.matchRegistration.match.status = org.sport.backend.constant.MatchStatus.COMPLETED
            """)
    BigDecimal sumMatchJoinPaidAmount(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("date") LocalDate date
    );

    @Query("SELECT p FROM Payment p WHERE p.transactionDate >= :startOfDay AND p.transactionDate <= :endOfDay " +
            "AND p.booking.rentalArea.rentalAreaId = :rentalAreaId AND p.paymentStatus = 'SUCCESS'")
    List<Payment> findAllPaymentsByRentalArea(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay,
            @Param("rentalAreaId") UUID rentalAreaId
    );

    @Query("SELECT p FROM Payment p WHERE p.transactionDate >= :startOfDay AND p.transactionDate <= :endOfDay " +
            "AND p.matchRegistration.match.court.rentalArea.rentalAreaId = :rentalAreaId " +
            "AND p.paymentStatus = 'SUCCESS'")
    List<Payment> findAllMatchPaymentsByRentalArea(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay,
            @Param("rentalAreaId") UUID rentalAreaId
    );

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.matchRegistration.match.matchId = :matchId AND p.paymentStatus = 'SUCCESS'")
    BigDecimal sumPaidAmountForMatch(@Param("matchId") UUID matchId);

    @Query("SELECT p FROM Payment p WHERE p.matchRegistration.match.matchId = :matchId AND p.paymentStatus = 'SUCCESS'")
    List<Payment> findSuccessfulPaymentsByMatch(@Param("matchId") UUID matchId);

    List<Payment> findAllByMatchRegistration(MatchRegistration reg);

    boolean existsByUser_UserIdAndPaymentStatusIn(
            UUID userId,
            Collection<PaymentStatus> statuses
    );

    List<Payment> findAllByUser_UserId(UUID userId);

    List<Payment> findAllByBookingIntent_User_UserId(UUID userId);

    Optional<Payment>
    findTopByBookingParticipantAndPaymentMethodAndPaymentStatusOrderByTransactionDateDesc(
            BookingParticipant bookingParticipant,
            PaymentMethod paymentMethod,
            PaymentStatus paymentStatus
    );

    @Query("""
            SELECT payment
            FROM Payment payment
            WHERE payment.booking.bookingId = :bookingId
              AND payment.paymentType =
                  org.sport.backend.constant.PaymentType.SHARED_BOOKING
            ORDER BY payment.transactionDate DESC
            """)
    List<Payment> findAllSharedTicketPaymentsByBookingId(
            @Param("bookingId") UUID bookingId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT payment
            FROM Payment payment
            WHERE payment.paymentId = :paymentId
            """)
    Optional<Payment> findByIdForUpdate(@Param("paymentId") UUID paymentId);

    @Query("""
            SELECT payment
            FROM Payment payment
            WHERE payment.paymentStatus = :status
              AND payment.paymentMethod <> :ownerPaymentMethod
            """)
    Page<Payment> findAdminRefundsByStatus(
            @Param("status")
            PaymentStatus status,

            @Param("ownerPaymentMethod")
            PaymentMethod ownerPaymentMethod,

            Pageable pageable
    );

    @Query("""
            SELECT payment
            FROM Payment payment
            WHERE payment.paymentStatus IN :statuses
              AND payment.paymentMethod <> :ownerPaymentMethod
            """)
    Page<Payment> findAdminRefundsByStatuses(
            @Param("statuses") Collection<PaymentStatus> statuses,
            @Param("ownerPaymentMethod") PaymentMethod ownerPaymentMethod,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT payment
            FROM Payment payment
            
            LEFT JOIN payment.booking booking
            LEFT JOIN booking.rentalArea bookingArea
            LEFT JOIN bookingArea.owner bookingOwner
            
            LEFT JOIN payment.bookingParticipant participant
            LEFT JOIN participant.booking participantBooking
            LEFT JOIN participantBooking.rentalArea participantArea
            LEFT JOIN participantArea.owner participantOwner
            
            LEFT JOIN payment.matchRegistration registration
            LEFT JOIN registration.match matchEntity
            LEFT JOIN matchEntity.court matchCourt
            LEFT JOIN matchCourt.rentalArea matchArea
            LEFT JOIN matchArea.owner matchOwner
            
            WHERE payment.paymentStatus = :status
              AND payment.paymentMethod = :paymentMethod
              AND (
                    (
                        bookingOwner.userId = :ownerId
                        AND (
                            :rentalAreaId IS NULL
                            OR bookingArea.rentalAreaId = :rentalAreaId
                        )
                    )
                    OR
                    (
                        participantOwner.userId = :ownerId
                        AND (
                            :rentalAreaId IS NULL
                            OR participantArea.rentalAreaId = :rentalAreaId
                        )
                    )
                    OR
                    (
                        matchOwner.userId = :ownerId
                        AND (
                            :rentalAreaId IS NULL
                            OR matchArea.rentalAreaId = :rentalAreaId
                        )
                    )
              )
            """)
    Page<Payment> findOwnerRefundsByStatus(
            @Param("ownerId") UUID ownerId,
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("status") PaymentStatus status,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT payment
            FROM Payment payment
            
            LEFT JOIN payment.booking booking
            LEFT JOIN booking.rentalArea bookingArea
            LEFT JOIN bookingArea.owner bookingOwner
            
            LEFT JOIN payment.bookingParticipant participant
            LEFT JOIN participant.booking participantBooking
            LEFT JOIN participantBooking.rentalArea participantArea
            LEFT JOIN participantArea.owner participantOwner
            
            LEFT JOIN payment.matchRegistration registration
            LEFT JOIN registration.match matchEntity
            LEFT JOIN matchEntity.court matchCourt
            LEFT JOIN matchCourt.rentalArea matchArea
            LEFT JOIN matchArea.owner matchOwner
            
            WHERE payment.paymentStatus IN :statuses
              AND payment.paymentMethod = :paymentMethod
              AND (
                    (
                        bookingOwner.userId = :ownerId
                        AND (
                            :rentalAreaId IS NULL
                            OR bookingArea.rentalAreaId = :rentalAreaId
                        )
                    )
                    OR
                    (
                        participantOwner.userId = :ownerId
                        AND (
                            :rentalAreaId IS NULL
                            OR participantArea.rentalAreaId = :rentalAreaId
                        )
                    )
                    OR
                    (
                        matchOwner.userId = :ownerId
                        AND (
                            :rentalAreaId IS NULL
                            OR matchArea.rentalAreaId = :rentalAreaId
                        )
                    )
              )
            """)
    Page<Payment> findOwnerRefundsByStatuses(
            @Param("ownerId") UUID ownerId,
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("statuses") Collection<PaymentStatus> statuses,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            Pageable pageable
    );

    Optional<Payment> findTopByBookingParticipantOrderByTransactionDateDesc(
            BookingParticipant bookingParticipant
    );

}
