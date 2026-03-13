package org.sport.backend.repository;

import org.sport.backend.entity.Court;
import org.sport.backend.entity.CourtCopy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CourtCopyRepository extends JpaRepository<CourtCopy, UUID>, JpaSpecificationExecutor<CourtCopy> {
    List<CourtCopy> findByCourt(Court court);

    List<CourtCopy> findByCourt_CourtId(UUID courtId);

    int countByCourt(Court court);

    @Query("""
            SELECT cc FROM CourtCopy cc
            WHERE cc.court.courtId = :courtId
            AND cc.courtCopyStatus = 'ACTIVE'
            AND NOT EXISTS (
                SELECT s FROM Slot s
                WHERE s.courtCopy.courtCopyId = cc.courtCopyId
                AND s.slotStatus = 'BOOKED'
                AND (:start < s.endTime AND :end > s.startTime)
            )
            """)
    List<CourtCopy> findAvailableCourtCopy(
            UUID courtId,
            LocalDateTime start,
            LocalDateTime end
    );
}
