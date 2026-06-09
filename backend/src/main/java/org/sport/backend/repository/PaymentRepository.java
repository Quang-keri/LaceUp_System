package org.sport.backend.repository;

import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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

    Page<Payment> findByPaymentStatus(PaymentStatus status, Pageable pageable);

    List<Payment> findAllByMatchRegistration(MatchRegistration reg);

    boolean existsByUser_UserIdAndPaymentStatusIn(
            UUID userId,
            Collection<PaymentStatus> statuses
    );

    List<Payment> findAllByUser_UserId(UUID userId);

    List<Payment> findAllByBookingIntent_User_UserId(UUID userId);
}
