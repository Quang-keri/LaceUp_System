package org.sport.backend.repository;

import org.sport.backend.constant.ResultStatus;
import org.sport.backend.entity.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchResultRepository extends JpaRepository<MatchResult, UUID> {
    List<MatchResult> findByMatch_MatchId(UUID matchId);

    // Tìm báo cáo đang chờ duyệt của một trận đấu
    Optional<MatchResult> findByMatch_MatchIdAndStatus(UUID matchId, ResultStatus status);

    boolean existsByMatch_MatchIdAndStatus(UUID matchId, ResultStatus status);

    @Query("SELECT COUNT(mr) FROM MatchResult mr JOIN mr.winnerIds w WHERE w = :userId AND mr.status = 'APPROVED'")
    long countTotalWinsByUserId(@Param("userId") UUID userId);


    @Modifying
    @Query(
            value = """
                DELETE FROM match_result_winners
                WHERE user_id = :userId
                """,
            nativeQuery = true
    )
    void deleteWinnerReferences(@Param("userId") UUID userId);

    @Modifying
    @Query(
            value = """
                DELETE FROM match_result_losers
                WHERE user_id = :userId
                """,
            nativeQuery = true
    )
    void deleteLoserReferences(@Param("userId") UUID userId);

    @Modifying
    @Query(
            value = """
                DELETE FROM match_result_absent_users
                WHERE user_id = :userId
                """,
            nativeQuery = true
    )
    void deleteAbsentReferences(@Param("userId") UUID userId);

    @Modifying
    @Query(
            value = """
                DELETE FROM match_result_rank_changes
                WHERE user_id = :userId
                """,
            nativeQuery = true
    )
    void deleteRankChangeReferences(@Param("userId") UUID userId);

    @Modifying
    @Query("""
        UPDATE MatchResult mr
        SET mr.submitterId = NULL
        WHERE mr.submitterId = :userId
    """)
    void clearSubmitter(@Param("userId") UUID userId);
}