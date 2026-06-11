package org.sport.backend.repository;

import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.entity.IntentSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface IntentSlotRepository
        extends JpaRepository<IntentSlot, UUID> {

    @Query("""
                SELECT COUNT(intentSlot)
                FROM IntentSlot intentSlot
                WHERE intentSlot.courtCopy.courtCopyId = :courtCopyId
                  AND intentSlot.startTime < :endTime
                  AND intentSlot.endTime > :startTime
                  AND (
                        (
                            intentSlot.bookingIntent.status = :activeStatus
                            AND intentSlot.bookingIntent.expiresAt > :now
                        )
                        OR intentSlot.bookingIntent.status = :pendingOwnerStatus
                  )
            """)
    long countBlockingIntentSlots(
            @Param("courtCopyId") UUID courtCopyId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("now") LocalDateTime now,
            @Param("activeStatus") BookingIntentStatus activeStatus,
            @Param("pendingOwnerStatus")
            BookingIntentStatus pendingOwnerStatus
    );

}
