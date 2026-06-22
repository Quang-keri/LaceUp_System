package org.sport.backend.repository;

import jakarta.persistence.LockModeType;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID>, JpaSpecificationExecutor<Match> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Match m WHERE m.matchId = :id")
    Optional<Match> findByIdWithLock(UUID id);

    @Query("SELECT DISTINCT m FROM Match m " +
            "JOIN m.registrations r " +
            "WHERE r.user = :user")
    Page<Match> findMatchesByParticipantOrHost(@Param("user") User user, Pageable pageable);

    List<Match> findByIsRecurringTrue();

    List<Match> findByStatus(MatchStatus status);

    @Query("SELECT m FROM Match m WHERE m.startTime >= :startOfDay AND m.startTime <= :endOfDay")
    List<Match> findAllMatchesForReport(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    Optional<Match> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);

    @Query("SELECT m FROM Match m WHERE m.status IN :statuses AND m.startTime <= :thresholdTime")
    List<Match> findMatchesToAutoCancel(
            @Param("statuses") List<MatchStatus> statuses,
            @Param("thresholdTime") LocalDateTime thresholdTime
    );

    @Query("SELECT COUNT(m) > 0 FROM Match m " +
            "WHERE m.court.courtId = :courtId " +
            "AND m.status NOT IN ('CANCELLED', 'COMPLETED') " +
            "AND m.startTime < :endTime AND m.endTime > :startTime " +
            "AND (:excludeMatchId IS NULL OR m.matchId != :excludeMatchId)")
    boolean existsConflictMatch(
            @Param("courtId") UUID courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeMatchId") UUID excludeMatchId
    );

    boolean existsByHost_UserIdAndStatusIn(
            UUID userId,
            Collection<MatchStatus> statuses
    );

    List<Match> findAllByHost_UserId(UUID userId);

    boolean existsByCourt_RentalArea_Owner_UserIdAndStatusIn(
            UUID ownerId,
            Collection<MatchStatus> statuses
    );

    @Query("SELECT m FROM Match m LEFT JOIN FETCH m.booking " +
            "WHERE m.status IN :pendingStatuses AND m.endTime < :startOfToday")
    List<Match> findByStatusInAndEndTimeBefore(
            @Param("pendingStatuses") List<MatchStatus> pendingStatuses,
            @Param("startOfToday") LocalDateTime startOfToday
    );

}
