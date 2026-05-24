package org.sport.backend.event.achievement.implement;

import lombok.extern.slf4j.Slf4j;
import org.sport.backend.event.achievement.AchievementChecker;
import org.sport.backend.constant.AchievementType;
import org.sport.backend.entity.MatchResult;
import org.sport.backend.entity.User;
import org.sport.backend.repository.MatchResultRepository;

@Slf4j
public class TotalWinsChecker implements AchievementChecker {

    private final MatchResultRepository matchResultRepository;
    private final AchievementType type;
    private final int targetWins;

    public TotalWinsChecker(MatchResultRepository matchResultRepository, AchievementType type, int targetWins) {
        this.matchResultRepository = matchResultRepository;
        this.type = type;
        this.targetWins = targetWins;
    }

    @Override
    public AchievementType getAchievementType() {
        return this.type;
    }

    @Override
    public boolean hasQualified(User user, MatchResult currentResult) {
        long totalWins = matchResultRepository.countTotalWinsByUserId(user.getUserId());

        log.info("       * [Checker - {}] User [{}] đang có tổng {} trận thắng. (Mục tiêu cần: {})",
                this.type.name(), user.getUserName(), totalWins, targetWins);

        return totalWins >= targetWins;
    }
}