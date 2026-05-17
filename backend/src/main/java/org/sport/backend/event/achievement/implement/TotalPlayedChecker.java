package org.sport.backend.event.achievement.implement;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.sport.backend.event.achievement.AchievementChecker;
import org.sport.backend.constant.AchievementType;
import org.sport.backend.entity.MatchResult;
import org.sport.backend.entity.User;
import org.sport.backend.repository.MatchRegistrationRepository;

@AllArgsConstructor
public class TotalPlayedChecker implements AchievementChecker {

    private final MatchRegistrationRepository registrationRepository;
    private final AchievementType type;
    private final int targetMatches;

    @Override
    public AchievementType getAchievementType() {
        return this.type;
    }

    @Override
    public boolean hasQualified(User user, MatchResult currentResult) {
        long totalPlayed = registrationRepository.countPlayedMatches(user.getUserId());
        return totalPlayed >= targetMatches;
    }
}