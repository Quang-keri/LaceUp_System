package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.sport.backend.event.achievement.AchievementChecker;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.MatchResult;
import org.sport.backend.entity.User;
import org.sport.backend.entity.UserAchievement;
import org.sport.backend.event.MatchResultApprovedEvent;
import org.sport.backend.repository.MatchRegistrationRepository;
import org.sport.backend.repository.UserAchievementRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementServiceImpl {

    private final List<AchievementChecker> checkers;

    private final UserAchievementRepository userAchievementRepository;
    private final MatchRegistrationRepository registrationRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processAchievements(MatchResultApprovedEvent event) {
        MatchResult result = event.getMatchResult();

        List<MatchRegistration> registrations = registrationRepository.findByMatch(result.getMatch());
        List<java.util.UUID> absentIds = result.getAbsentUserIds() != null ? result.getAbsentUserIds() : List.of();

        for (MatchRegistration reg : registrations) {
            User user = reg.getUser();

            if (absentIds.contains(user.getUserId())) {
                log.info(" -> Bỏ qua User [{}] vì vắng mặt.", user.getUserName());
                continue;
            }

            for (AchievementChecker checker : checkers) {
                boolean alreadyHas = userAchievementRepository
                        .existsByUser_UserIdAndAchievementType(user.getUserId(), checker.getAchievementType());

                if (alreadyHas) {
                    continue;
                }

                if (checker.hasQualified(user, result)) {

                    UserAchievement newAchievement = UserAchievement.builder()
                            .user(user)
                            .achievementType(checker.getAchievementType())
                            .achievedAt(LocalDateTime.now())
                            .build();

                    userAchievementRepository.save(newAchievement);
                } else {
                    log.info("    - Chưa đủ điều kiện cho [{}]", checker.getAchievementType().getTitle());
                }
            }
        }
    }
}