package org.sport.backend.event.achievement.implement;

import lombok.AllArgsConstructor;
import org.sport.backend.event.achievement.AchievementChecker;
import org.sport.backend.constant.AchievementType;
import org.sport.backend.entity.MatchResult;
import org.sport.backend.entity.User;
import org.sport.backend.entity.UserCategoryRank;
import org.sport.backend.repository.UserCategoryRankRepository;

import java.util.List;

@AllArgsConstructor
public class WinStreakChecker implements AchievementChecker {

    private final UserCategoryRankRepository rankRepository;
    private final AchievementType type;
    private final int targetStreak;

    @Override
    public AchievementType getAchievementType() {
        return this.type;
    }

    @Override
    public boolean hasQualified(User user, MatchResult currentResult) {
        List<UserCategoryRank> ranks = rankRepository.findByUser_UserId(user.getUserId());
        return ranks.stream()
                .anyMatch(rank -> rank.getCurrentWinStreak() >= targetStreak);
    }
}