package org.sport.backend.repository;

import org.sport.backend.constant.MatchStatus;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MatchRegistrationRepository extends JpaRepository<MatchRegistration, UUID> {
    boolean existsByMatchAndUser(Match match, User user);

    List<MatchRegistration> findByMatch(Match match);

    Optional<MatchRegistration> findByMatchAndUser(Match match, User user);

    Optional<MatchRegistration> findByMatchAndUser_UserId(Match match, UUID submitterId);

    @Query("SELECT COUNT(reg) FROM MatchRegistration reg WHERE reg.user.userId = :userId AND reg.match.status = 'COMPLETED'")
    long countPlayedMatches(@Param("userId") UUID userId);

    @Query("SELECT r FROM MatchRegistration r WHERE r.match = :match AND r.user = :user AND (r.isCancelled = false OR r.isCancelled IS NULL)")
    Optional<MatchRegistration> findActiveByMatchAndUser(@Param("match") Match match, @Param("user") User user);

    boolean existsByUser_UserIdAndMatch_StatusIn(
            UUID userId,
            Collection<MatchStatus> statuses
    );

    List<MatchRegistration> findAllByUser_UserId(UUID userId);
}
