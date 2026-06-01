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

    @Query("""
                SELECT HOUR(b.startTime), COUNT(b)
                FROM Booking b
                WHERE b.startTime BETWEEN :startDate AND :endDate
                  AND b.rentalArea.owner.userId = :ownerId
                GROUP BY HOUR(b.startTime)
                ORDER BY COUNT(b) DESC
            """)
    List<Object[]> findPeakBookingHours(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("ownerId") UUID ownerId
    );


    boolean existsByRenterAndRentalAreaAndBookingStatus(User renter, RentalArea rentalArea, BookingStatus bookingStatus);
        boolean existsByBookerPhoneAndRentalAreaAndBookingStatus(String bookerPhone, RentalArea rentalArea, BookingStatus bookingStatus);
    List<Booking> findByRentalArea_RentalAreaIdAndCreatedAtBetween(
            UUID rentalAreaId,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt >= :startDate AND b.createdAt <= :endDate AND (:ownerId IS NULL OR b.rentalArea.owner.userId = :ownerId)")
    Long countBookingsInRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, @Param("ownerId") UUID ownerId);

    @Query("SELECT b FROM Booking b WHERE b.rentalArea.rentalAreaId = :rentalAreaId " +
            "AND b.createdAt >= :startOfDay AND b.createdAt <= :endOfDay")
    List<Booking> findAllBookingsForReportByArea(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay,
            @Param("rentalAreaId") UUID rentalAreaId
    );

    @Query("""
        SELECT COALESCE(SUM(b.totalPrice), 0)
        FROM Booking b
        WHERE b.rentalArea.rentalAreaId = :rentalAreaId
          AND DATE(b.startTime) = :settlementDate
          AND b.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
    """)
    BigDecimal sumTotalAmountOfCompletedBookings(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("settlementDate") LocalDate settlementDate
    );

    @Query("""
        SELECT COALESCE(SUM(b.totalPrice), 0)
        FROM Booking b
        WHERE b.rentalArea.rentalAreaId = :rentalAreaId
          AND b.startTime >= :startDate AND b.startTime < :endDate
          AND b.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
    """)
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
      AND b.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
""")
    BigDecimal sumSlotRevenueOfCompletedBookings(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("date") LocalDate date
    );
    @Query("""
    SELECT COALESCE(SUM(b.depositAmount), 0)
    FROM Booking b
    WHERE b.rentalArea.rentalAreaId = :rentalAreaId
      AND CAST(b.startTime AS date) = :date
      AND b.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
""")
    BigDecimal sumInitialPaidAmountOfCompletedBookings(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("date") LocalDate date
    );
    @Query("""
    SELECT COALESCE(SUM(b.totalPrice), 0)
    FROM Booking b
    WHERE b.rentalArea.rentalAreaId = :rentalAreaId
      AND CAST(b.startTime AS date) = :date
      AND b.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
""")
    BigDecimal sumTotalPriceOfCompletedBookings(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("date") LocalDate date
    );
}