package org.sport.backend.service;


import org.sport.backend.dto.response.user.UserAchievementResponse;

import java.util.List;
import java.util.UUID;

public interface UserAchievementService {

    List<UserAchievementResponse> getMyAchievements();

    List<UserAchievementResponse> getUserAchievements(UUID userId);
}