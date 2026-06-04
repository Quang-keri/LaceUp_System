package org.sport.backend.repository;

import jakarta.persistence.LockModeType;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.entity.Court;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID>, JpaSpecificationExecutor<Match> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Match m WHERE m.matchId = :id")
    Optional<Match> findByIdWithLock(UUID id);

    List<Match> findByStatusIn(List<MatchStatus> statuses);

    @Query("SELECT m FROM Match m " +
            "WHERE m.court.rentalArea.owner = :owner " +
            "OR m.host = :owner")
    Page<Match> findByOwnerSystem(User owner, Pageable pageable);

    @Query("SELECT DISTINCT m FROM Match m " +
            "JOIN m.registrations r " +
            "WHERE r.user = :user")
    Page<Match> findMatchesByParticipantOrHost(@Param("user") User user, Pageable pageable);

    List<Match> findByIsRecurringTrue();

    boolean existsByCourtAndStartTime(Court court, LocalDateTime localDateTime);

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

    List<Match> findByStatusAndEndTimeBefore(
            MatchStatus status,
            LocalDateTime endTime
    );

//    @Query("SELECT COUNT(m) > 0 FROM Match m " +
//            "WHERE m.court.courtId = :courtId " +
//            "AND m.status NOT IN :excludedStatuses " +
//            "AND m.startTime < :endTime AND m.endTime > :startTime " +
//            "AND (:excludeMatchId IS NULL OR m.matchId != :excludeMatchId)")
//    boolean existsConflictMatch(
//            @Param("courtId") UUID courtId,
//            @Param("startTime") LocalDateTime startTime,
//            @Param("endTime") LocalDateTime endTime,
//            @Param("excludeMatchId") UUID excludeMatchId,
//            @Param("excludedStatuses") List<MatchStatus> excludedStatuses
//    );

}
