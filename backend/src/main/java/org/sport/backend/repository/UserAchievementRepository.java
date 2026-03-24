package org.sport.backend.repository;

import org.sport.backend.constant.AchievementType;
import org.sport.backend.entity.User;
import org.sport.backend.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {

    List<UserAchievement> findByUser_UserIdOrderByAchievedAtDesc(UUID userId);

    boolean existsByUserAndAchievementType(User user, AchievementType achievementType);
}