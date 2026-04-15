package org.sport.backend.repository;

import org.sport.backend.entity.Match;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MatchRegistrationRepository extends JpaRepository<MatchRegistration, UUID> {
    boolean existsByMatchAndUser(Match match, User user);

    List<MatchRegistration> findByMatch(Match match);

    Optional<MatchRegistration> findByMatchAndUser(Match match, User user);

    Optional<MatchRegistration> findByMatchAndUser_UserId(Match match, UUID submitterId);
}
