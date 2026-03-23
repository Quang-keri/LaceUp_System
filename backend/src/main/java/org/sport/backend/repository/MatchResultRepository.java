package org.sport.backend.repository;

import org.sport.backend.constant.ResultStatus;
import org.sport.backend.entity.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;
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
}