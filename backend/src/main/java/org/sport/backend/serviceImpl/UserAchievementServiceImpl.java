package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.response.user.UserAchievementResponse;
import org.sport.backend.entity.User;
import org.sport.backend.entity.UserAchievement;
import org.sport.backend.repository.UserAchievementRepository;
import org.sport.backend.service.UserAchievementService;
import org.sport.backend.service.UserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserAchievementServiceImpl implements UserAchievementService {

    private final UserAchievementRepository achievementRepository;
    private final UserService userService;

    @Override
    public List<UserAchievementResponse> getMyAchievements() {
        User currentUser = userService.getCurrentUserEntity();
        return getUserAchievements(currentUser.getUserId());
    }

    @Override
    public List<UserAchievementResponse> getUserAchievements(UUID userId) {
        List<UserAchievement> achievements = achievementRepository.findByUser_UserIdOrderByAchievedAtDesc(userId);

        return achievements.stream().map(achievement -> UserAchievementResponse.builder()
                .id(achievement.getId())
                .achievementCode(achievement.getAchievementType().name())
                .description(achievement.getAchievementType().getDescription())
                .achievedAt(achievement.getAchievedAt())
                .build()
        ).collect(Collectors.toList());
    }
}