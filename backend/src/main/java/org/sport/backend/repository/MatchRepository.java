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
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID>, JpaSpecificationExecutor<Match> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Match m WHERE m.matchId = :id")
    Optional<Match> findByIdWithLock(UUID id);

    List<Match> findByStatusIn(List<MatchStatus> statuses);

    Page<Match> findByHost(User host, Pageable pageable);
}
