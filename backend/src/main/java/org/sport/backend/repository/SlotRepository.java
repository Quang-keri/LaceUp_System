package org.sport.backend.repository;


import org.sport.backend.constant.SlotStatus;
import org.sport.backend.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID>, JpaSpecificationExecutor<Slot> {
    @Query("""
                SELECT s FROM Slot s
                WHERE s.courtCopy.courtCopyId = :courtCopyId
                AND s.startTime < :endTime
                AND s.endTime > :startTime
            """)
    List<Slot> findConflictSlot(
            UUID courtCopyId,
            LocalDateTime startTime,
            LocalDateTime endTime
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
}
