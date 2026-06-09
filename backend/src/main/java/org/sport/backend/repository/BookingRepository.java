package org.sport.backend.repository;

import org.sport.backend.constant.BookingStatus;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
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

    @Query("""
                SELECT COALESCE(SUM(b.totalPrice), 0)
                FROM Booking b
                WHERE b.rentalArea.rentalAreaId = :rentalAreaId
                  AND b.startTime >= :startDate AND b.startTime < :endDate
                  AND b.bookingStatus IN (org.sport.backend.constant.BookingStatus.COMPLETED,\s
                                          org.sport.backend.constant.BookingStatus.BOOKED)
           \s""")
    BigDecimal sumTotalAmountOfCompletedBookingsMonthly(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

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

    @Query("""
                SELECT COALESCE(SUM(s.price), 0)
                FROM Booking b
                JOIN b.slots s
                WHERE b.rentalArea.rentalAreaId = :rentalAreaId
                  AND CAST(b.startTime AS date) = :date
                  AND b.bookingStatus IN (org.sport.backend.constant.BookingStatus.COMPLETED,\s
                                          org.sport.backend.constant.BookingStatus.BOOKED)
           \s""")
    BigDecimal sumSlotRevenueByDate(@Param("rentalAreaId") UUID rentalAreaId, @Param("date") LocalDate date);

    @Query("""
                SELECT COALESCE(SUM(b.depositAmount), 0)
                FROM Booking b
                WHERE b.rentalArea.rentalAreaId = :rentalAreaId
                  AND CAST(b.startTime AS date) = :date
                  AND b.bookingStatus IN (org.sport.backend.constant.BookingStatus.COMPLETED,\s
                                          org.sport.backend.constant.BookingStatus.BOOKED)
           \s""")
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
}