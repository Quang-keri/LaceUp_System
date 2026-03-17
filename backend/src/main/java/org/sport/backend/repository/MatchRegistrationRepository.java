package org.sport.backend.repository;

import org.sport.backend.entity.Match;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MatchRegistrationRepository extends JpaRepository<MatchRegistration, UUID> {
    boolean existsByMatchAndUser(Match match, User user);
}
