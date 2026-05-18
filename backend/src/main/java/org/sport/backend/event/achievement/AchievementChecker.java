package org.sport.backend.event.achievement;

import org.sport.backend.constant.AchievementType;
import org.sport.backend.entity.MatchResult;
import org.sport.backend.entity.User;

public interface AchievementChecker {
    AchievementType getAchievementType();

    boolean hasQualified(User user, MatchResult currentResult);
}