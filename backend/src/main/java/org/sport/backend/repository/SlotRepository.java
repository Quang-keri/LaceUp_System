package org.sport.backend.repository;


import org.sport.backend.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID> , JpaSpecificationExecutor<Slot> {
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

}
