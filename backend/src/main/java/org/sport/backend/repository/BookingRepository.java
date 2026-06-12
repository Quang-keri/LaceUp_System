package org.sport.backend.repository;

import jakarta.persistence.LockModeType;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.BookingType;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
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
public interface BookingRepository extends JpaRepository<Booking, UUID>, JpaSpecificationExecutor<Booking> {

    @Query("SELECT b.bookingStatus, COUNT(b) FROM Booking b " +
            "WHERE b.createdAt BETWEEN :startDate AND :endDate " +
            "AND (:ownerId IS NULL OR b.rentalArea.owner.userId = :ownerId) " +
            "GROUP BY b.bookingStatus")
    List<Object[]> countAllByStatus(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("ownerId") UUID ownerId
    );

    @Query("SELECT c.courtName, COUNT(b) FROM Booking b " +
            "JOIN b.slots s JOIN s.courtCopy cc JOIN cc.court c " +
            "WHERE b.startTime BETWEEN :startDate AND :endDate " +
            "AND (:ownerId IS NULL OR b.rentalArea.owner.userId = :ownerId) " +
            "GROUP BY c.courtName ORDER BY COUNT(b) DESC")
    List<Object[]> findTopCourtsByBookingCount(LocalDateTime startDate, LocalDateTime endDate, UUID ownerId, Pageable pageable);

    boolean existsByRenterAndRentalAreaAndBookingStatus(User renter, RentalArea rentalArea, BookingStatus bookingStatus);

    boolean existsByBookerPhoneAndRentalAreaAndBookingStatus(String bookerPhone, RentalArea rentalArea, BookingStatus bookingStatus);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt >= :startDate AND b.createdAt <= :endDate AND (:ownerId IS NULL OR b.rentalArea.owner.userId = :ownerId)")
    Long countBookingsInRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, @Param("ownerId") UUID ownerId);

    @Query("SELECT b FROM Booking b WHERE b.rentalArea.rentalAreaId = :rentalAreaId " +
            "AND b.startTime >= :startDateTime AND b.startTime <= :endDateTime")
    List<Booking> findAllBookingsForReportByArea(@Param("startDateTime") LocalDateTime startDateTime,
                                                 @Param("endDateTime") LocalDateTime endDateTime,
                                                 @Param("rentalAreaId") UUID rentalAreaId);

    // =========================================================================
    // DOANH THU ĐỐI SOÁT THÁNG (Đã fix cho kèo vãng lai)
    // =========================================================================
    @Query("""
                     SELECT COALESCE(SUM(b.totalPrice), 0)
                     FROM Booking b
                     WHERE b.rentalArea.rentalAreaId = :rentalAreaId
                       AND b.startTime >= :startDate AND b.startTime < :endDate
                       AND b.bookingStatus IN (org.sport.backend.constant.BookingStatus.COMPLETED, org.sport.backend.constant.BookingStatus.BOOKED)
                       AND b.bookingType != org.sport.backend.constant.BookingType.SHARED
            """)
    BigDecimal sumNonSharedTotalAmountMonthly(@Param("rentalAreaId") UUID rentalAreaId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
                     SELECT COALESCE(SUM(bp.amountPaid), 0)
                     FROM BookingParticipant bp
                     WHERE bp.booking.rentalArea.rentalAreaId = :rentalAreaId
                       AND bp.booking.startTime >= :startDate AND bp.booking.startTime < :endDate
                       AND bp.booking.bookingStatus IN (org.sport.backend.constant.BookingStatus.COMPLETED, org.sport.backend.constant.BookingStatus.BOOKED)
                       AND bp.booking.bookingType = org.sport.backend.constant.BookingType.SHARED
                       AND bp.paymentStatus IN (org.sport.backend.constant.PaymentStatus.SUCCESS, org.sport.backend.constant.PaymentStatus.BOOKED, org.sport.backend.constant.PaymentStatus.COMPLETED)
            """)
    BigDecimal sumSharedTotalAmountMonthly(@Param("rentalAreaId") UUID rentalAreaId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    default BigDecimal sumTotalAmountOfCompletedBookingsMonthly(UUID rentalAreaId, LocalDateTime startDate, LocalDateTime endDate) {
        BigDecimal nonShared = sumNonSharedTotalAmountMonthly(rentalAreaId, startDate, endDate);
        BigDecimal shared = sumSharedTotalAmountMonthly(rentalAreaId, startDate, endDate);
        return (nonShared != null ? nonShared : BigDecimal.ZERO).add(shared != null ? shared : BigDecimal.ZERO);
    }

    @Query("""
                SELECT COUNT(b)
                FROM Booking b
                WHERE b.rentalArea.rentalAreaId = :rentalAreaId
                  AND b.startTime >= :startDate AND b.startTime < :endDate
                  AND b.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
            """)
    Long countCompletedBookingsMonthly(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // =========================================================================
    // DOANH THU ĐỐI SOÁT NGÀY (Đã fix cho kèo vãng lai)
    // =========================================================================
    @Query("""
                     SELECT COALESCE(SUM(s.price), 0)
                     FROM Slot s
                     WHERE s.booking.rentalArea.rentalAreaId = :rentalAreaId
                       AND CAST(s.booking.startTime AS date) = :date
                       AND s.booking.bookingStatus IN (org.sport.backend.constant.BookingStatus.COMPLETED, org.sport.backend.constant.BookingStatus.BOOKED)
                       AND s.booking.bookingType != org.sport.backend.constant.BookingType.SHARED
            """)
    BigDecimal sumNonSharedSlotRevenueByDate(@Param("rentalAreaId") UUID rentalAreaId, @Param("date") LocalDate date);

    @Query("""
                     SELECT COALESCE(SUM(bp.amountPaid), 0)
                     FROM BookingParticipant bp
                     WHERE bp.booking.rentalArea.rentalAreaId = :rentalAreaId
                       AND CAST(bp.booking.startTime AS date) = :date
                       AND bp.booking.bookingStatus IN (org.sport.backend.constant.BookingStatus.COMPLETED, org.sport.backend.constant.BookingStatus.BOOKED)
                       AND bp.booking.bookingType = org.sport.backend.constant.BookingType.SHARED
                       AND bp.paymentStatus IN (org.sport.backend.constant.PaymentStatus.SUCCESS, org.sport.backend.constant.PaymentStatus.BOOKED, org.sport.backend.constant.PaymentStatus.COMPLETED)
            """)
    BigDecimal sumSharedSlotRevenueByDate(@Param("rentalAreaId") UUID rentalAreaId, @Param("date") LocalDate date);

    default BigDecimal sumSlotRevenueByDate(UUID rentalAreaId, LocalDate date) {
        BigDecimal nonShared = sumNonSharedSlotRevenueByDate(rentalAreaId, date);
        BigDecimal shared = sumSharedSlotRevenueByDate(rentalAreaId, date);
        return (nonShared != null ? nonShared : BigDecimal.ZERO).add(shared != null ? shared : BigDecimal.ZERO);
    }

    @Query("""
                 SELECT COALESCE(SUM(b.depositAmount), 0)
                 FROM Booking b
                 WHERE b.rentalArea.rentalAreaId = :rentalAreaId
                   AND CAST(b.startTime AS date) = :date
                   AND b.bookingStatus IN (org.sport.backend.constant.BookingStatus.COMPLETED, org.sport.backend.constant.BookingStatus.BOOKED)
            """)
    BigDecimal sumInitialPaidAmountByDate(@Param("rentalAreaId") UUID rentalAreaId, @Param("date") LocalDate date);

    boolean existsByRenter_UserIdAndBookingStatusIn(
            UUID userId,
            Collection<BookingStatus> statuses
    );

    boolean existsByRenter_UserIdAndDisputeFlagTrue(UUID userId);

    List<Booking> findAllByRenter_UserId(UUID userId);

    boolean existsByRentalArea_Owner_UserIdAndBookingStatusIn(
            UUID ownerId,
            Collection<BookingStatus> statuses
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
                SELECT b
                FROM Booking b
                WHERE b.bookingId = :bookingId
            """)
    Optional<Booking> findByIdForUpdate(
            @Param("bookingId") UUID bookingId
    );

    @Query("""
            SELECT booking
            FROM Booking booking
            WHERE booking.bookingType = :bookingType
              AND booking.bookingStatus = :bookingStatus
              AND (
                    booking.minimumCheckCompleted = false
                    OR booking.minimumCheckCompleted IS NULL
              )
              AND booking.startTime <= :deadline
              AND booking.startTime > :now
            """)
    List<Booking> findSharedBookingsDueForMinimumCheck(
            @Param("bookingType") BookingType bookingType,
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("now") LocalDateTime now,
            @Param("deadline") LocalDateTime deadline
    );

    @Query(
            value = """
                    SELECT b
                    FROM Booking b
                    WHERE b.bookingType = :bookingType
                      AND b.bookingStatus = :bookingStatus
                      AND b.startTime IS NOT NULL
                      AND b.startTime > :now
                      AND b.rentalArea IS NOT NULL
                      AND (
                            :rentalAreaId IS NULL
                            OR b.rentalArea.rentalAreaId = :rentalAreaId
                      )
                      AND COALESCE(b.maxParticipants, 0) >
                          COALESCE(
                              (
                                  SELECT SUM(bp.quantity)
                                  FROM BookingParticipant bp
                                  WHERE bp.booking = b
                                    AND bp.paymentStatus IN (:reservedStatuses)
                              ),
                              0
                          )
                    ORDER BY b.startTime ASC
                    """,
            countQuery = """
                    SELECT COUNT(b)
                    FROM Booking b
                    WHERE b.bookingType = :bookingType
                      AND b.bookingStatus = :bookingStatus
                      AND b.startTime IS NOT NULL
                      AND b.startTime > :now
                      AND b.rentalArea IS NOT NULL
                      AND (
                            :rentalAreaId IS NULL
                            OR b.rentalArea.rentalAreaId = :rentalAreaId
                      )
                      AND COALESCE(b.maxParticipants, 0) >
                          COALESCE(
                              (
                                  SELECT SUM(bp.quantity)
                                  FROM BookingParticipant bp
                                  WHERE bp.booking = b
                                    AND bp.paymentStatus IN (:reservedStatuses)
                              ),
                              0
                          )
                    """
    )
    Page<Booking> findOpenSharedBookingsForCommunity(
            @Param("bookingType") BookingType bookingType,
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("now") LocalDateTime now,
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("reservedStatuses") List<PaymentStatus> reservedStatuses,
            Pageable pageable
    );
}