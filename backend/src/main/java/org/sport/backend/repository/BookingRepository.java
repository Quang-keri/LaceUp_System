package org.sport.backend.repository;

import org.sport.backend.entity.Booking;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}