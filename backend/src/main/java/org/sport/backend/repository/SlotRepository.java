package org.sport.backend.repository;

import org.sport.backend.constant.SlotStatus;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.Slot;
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
public interface SlotRepository extends JpaRepository<Slot, UUID>, JpaSpecificationExecutor<Slot> {
    @Query("""
                SELECT s
                FROM Slot s
                WHERE s.courtCopy.courtCopyId = :courtCopyId
                  AND s.slotStatus IN ('BOOKED', 'PENDING')
                  AND s.booking IS NOT NULL
                  AND s.booking.bookingStatus <> 'CANCELLED'
                  AND s.startTime < :endTime
                  AND s.endTime > :startTime
            """)
    List<Slot> findConflictSlot(
            @Param("courtCopyId") UUID courtCopyId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("""
                SELECT COUNT(s) > 0 FROM Slot s
                WHERE s.courtCopy.courtCopyId = :courtCopyId
                  AND s.slotId <> :excludeSlotId
                  AND s.slotStatus <> 'CANCELLED'
                  AND s.startTime < :endTime
                  AND s.endTime > :startTime
            """)
    boolean existsConflictSlot(
            @Param("courtCopyId") UUID courtCopyId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeSlotId") UUID excludeSlotId
    );

    @Query("""
                SELECT COUNT(s)
                FROM Slot s
                WHERE s.slotStatus = :slotStatus
                  AND s.startTime BETWEEN :startDate AND :endDate
                  AND s.courtCopy.court.rentalArea.owner.userId = :ownerId
            """)
    Long countByStatusAndDate(
            @Param("slotStatus") SlotStatus slotStatus,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("ownerId") UUID ownerId
    );

    @Query("""
                SELECT COUNT(s)
                FROM Slot s
                WHERE s.startTime BETWEEN :startDate AND :endDate
                  AND s.courtCopy.court.rentalArea.owner.userId = :ownerId
            """)
    Long countTotalSlots(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("ownerId") UUID ownerId
    );

    @Query("SELECT COUNT(s) > 0 FROM Slot s " +
            "WHERE s.courtCopy.court.courtId = :courtId " +
            "AND s.slotStatus != 'CANCELLED' " +
            "AND s.startTime < :endTime AND s.endTime > :startTime")
    boolean existsConflictSlotForCourt(
            @Param("courtId") UUID courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    List<Slot> findByMatch(Match match);

    @Query("""
                SELECT COALESCE(SUM(s.price), 0)
                FROM Slot s
                JOIN s.booking b
                WHERE b.rentalArea.rentalAreaId = :rentalAreaId
                AND DATE(b.startTime) = :settlementDate
                AND EXISTS (
                    SELECT 1 FROM Transaction t 
                    WHERE t.booking = b 
                    AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
                    AND t.type = org.sport.backend.constant.TransactionType.INCOME
                    AND t.category IN (
                        org.sport.backend.constant.TransactionCategory.BOOKING_DEPOSIT,
                        org.sport.backend.constant.TransactionCategory.BOOKING_FULL_PAYMENT,
                        org.sport.backend.constant.TransactionCategory.BOOKING_REMAINING_PAYMENT
                    )
                )
            """)
    BigDecimal sumCommissionableSlotPrice(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("settlementDate") LocalDate settlementDate
    );


    @Query("""
        SELECT s FROM Slot s
        JOIN FETCH s.courtCopy cc
        JOIN FETCH cc.court c
        WHERE c.rentalArea.rentalAreaId = :rentalAreaId
        AND s.startTime < :endOfDay
        AND s.endTime > :startOfDay
    """)
    List<Slot> findScheduleByRentalAreaAndDate(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

}
