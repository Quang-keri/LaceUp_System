package org.sport.backend.event.achievement;

import lombok.RequiredArgsConstructor;
import org.sport.backend.repository.MatchResultRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.sport.backend.constant.AchievementType;
import org.sport.backend.event.achievement.implement.TotalPlayedChecker;
import org.sport.backend.event.achievement.implement.TotalWinsChecker;
import org.sport.backend.event.achievement.implement.WinStreakChecker;
import org.sport.backend.repository.MatchRegistrationRepository;
import org.sport.backend.repository.UserCategoryRankRepository;

@Configuration
@RequiredArgsConstructor
public class AchievementConfig {

    private final UserCategoryRankRepository rankRepository;
    private final MatchRegistrationRepository registrationRepository;
    private final MatchResultRepository matchResultRepository;

    @Bean
    public AchievementChecker firstBloodChecker() {
        return new TotalWinsChecker(matchResultRepository, AchievementType.FIRST_BLOOD, 1);
    }

    @Bean
    public AchievementChecker centurionChecker() {
        return new TotalWinsChecker(matchResultRepository, AchievementType.CENTURION, 50);
    }

    @Bean
    public AchievementChecker onFireChecker() {
        return new WinStreakChecker(rankRepository, AchievementType.ON_FIRE, 5);
    }

    @Bean
    public AchievementChecker unstoppableChecker() {
        return new WinStreakChecker(rankRepository, AchievementType.UNSTOPPABLE, 10);
    }

    @Bean
    public AchievementChecker veteranChecker() {
        return new TotalPlayedChecker(registrationRepository, AchievementType.VETERAN, 100);
    }

    @Bean
    public AchievementChecker legendChecker() {
        return new TotalPlayedChecker(registrationRepository, AchievementType.LEGEND, 500);
    }
}