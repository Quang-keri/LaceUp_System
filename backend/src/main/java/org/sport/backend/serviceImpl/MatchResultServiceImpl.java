package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.constant.MatchType;
import org.sport.backend.constant.ResultStatus;
import org.sport.backend.dto.request.match.MatchResultRequest;
import org.sport.backend.dto.response.match.MatchResultResponse;
import org.sport.backend.entity.*;
import org.sport.backend.event.MatchResultApprovedEvent;
import org.sport.backend.mapper.MatchResultMapper;
import org.sport.backend.repository.*;
import org.sport.backend.service.MatchResultService;
import org.sport.backend.service.UserService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchResultServiceImpl implements MatchResultService {

    private final MatchResultRepository matchResultRepository;
    private final MatchRepository matchRepository;
    private final MatchRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final ReputationLogRepository reputationLogRepository;
    private final UserCategoryRankRepository userCategoryRankRepository;

    private final UserService userService;

    private final MatchResultMapper matchResultMapper;

    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public MatchResultResponse submitResult(MatchResultRequest request) {
        User currentUser = userService.getCurrentUserEntity();
        Match match = matchRepository.findByIdWithLock(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        if (!registrationRepository.existsByMatchAndUser(match, currentUser)) {
            throw new RuntimeException("Chỉ người tham gia mới được gửi kết quả!");
        }

        if (match.getStatus() == MatchStatus.COMPLETED) {
            throw new RuntimeException("Trận đấu này đã kết thúc!");
        }

        if (matchResultRepository.existsByMatch_MatchIdAndStatus(match.getMatchId(), ResultStatus.PENDING)) {
            throw new RuntimeException("Đang có một kết quả chờ duyệt. Vui lòng xác nhận kết quả đó trước!");
        }

        List<MatchRegistration> registrations = registrationRepository.findByMatch(match);
        List<UUID> winnerIds = new ArrayList<>();
        List<UUID> loserIds = new ArrayList<>();

        Integer winningTeam = request.getWinningTeamNumber();
        if (winningTeam == null || (winningTeam != 1 && winningTeam != 2)) {
            throw new RuntimeException("Vui lòng chọn hợp lệ Đội 1 hoặc Đội 2 thắng!");
        }

        for (MatchRegistration reg : registrations) {
            if (reg.getTeamNumber() == null) {
                throw new RuntimeException("Trận đấu này chưa được Host chia đội hoàn tất!");
            }

            if (reg.getTeamNumber().equals(winningTeam)) {
                winnerIds.add(reg.getUser().getUserId());
            } else {
                loserIds.add(reg.getUser().getUserId());
            }
        }

        MatchResult result = MatchResult.builder()
                .match(match)
                .submitterId(currentUser.getUserId())
                .winningTeamNumber(winningTeam)
                .winnerIds(winnerIds)
                .loserIds(loserIds)
                .status(ResultStatus.PENDING)
                .absentUserIds(request.getAbsentUserIds())
                .build();

        match.setStatus(MatchStatus.WAITING_RESULT_APPROVAL);
        matchRepository.save(match);

        return matchResultMapper.toResponse(matchResultRepository.save(result));
    }

    @Override
    @Transactional
    public MatchResultResponse respondToResult(UUID resultId, boolean isAccepted) {
        User currentUser = userService.getCurrentUserEntity();
        MatchResult result = matchResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo kết quả này"));

        if (result.getStatus() != ResultStatus.PENDING) {
            throw new RuntimeException("Kết quả này đã được xử lý!");
        }

        Match match = result.getMatch();

        MatchRegistration currentReg = registrationRepository.findByMatchAndUser(match, currentUser)
                .orElseThrow(() -> new RuntimeException("Chỉ người tham gia mới được duyệt kết quả!"));

        MatchRegistration submitterReg = registrationRepository.findByMatchAndUser_UserId(match, result.getSubmitterId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người gửi kết quả"));

        if (currentReg.getTeamNumber() != null && currentReg.getTeamNumber().equals(submitterReg.getTeamNumber())) {
            throw new RuntimeException("Chỉ người thuộc đội đối thủ mới có quyền duyệt kết quả này!");
        }

        if (isAccepted) {
            result.setStatus(ResultStatus.APPROVED);
            match.setStatus(MatchStatus.COMPLETED);

            processCreditScore(result);

            if (match.getMatchType() == MatchType.RANKED) {
                processRankedMatch(result);
            } else if (match.getMatchType() == MatchType.BET) {
                processBetMatch(result);
            }

            eventPublisher.publishEvent(new MatchResultApprovedEvent(result));
        } else {
            result.setStatus(ResultStatus.REJECTED);
            match.setStatus(MatchStatus.DISPUTED);
        }

        matchRepository.save(match);
        return matchResultMapper.toResponse(matchResultRepository.save(result));
    }

    @Override
    public List<MatchResultResponse> getResultsByMatch(UUID matchId) {
        return matchResultMapper.toResponseList(matchResultRepository.findByMatch_MatchId(matchId));
    }

    private void processRankedMatch(MatchResult result) {
        Match match = result.getMatch();

        Category category = match.getCategory();
        if (category == null) {
            log.error("Lỗi cập nhật Rank: Trận đấu {} không xác định được môn thể thao (Category null)", match.getMatchId());
            return;
        }

        List<MatchRegistration> registrations = registrationRepository.findByMatch(match);
        List<UUID> winners = result.getWinnerIds();
        List<UUID> absents = result.getAbsentUserIds() != null ? result.getAbsentUserIds() : new ArrayList<>();

        Map<UUID, Integer> pointChangesLog = new HashMap<>();

        for (MatchRegistration reg : registrations) {
            User user = reg.getUser();
            UUID userId = user.getUserId();

            if (absents.contains(userId)) {
                pointChangesLog.put(userId, 0);
                continue;
            }

            boolean isWinner = winners.contains(user.getUserId());

            UserCategoryRank userRank = userCategoryRankRepository
                    .findByUser_UserIdAndCategory_CategoryId(user.getUserId(), category.getCategoryId())
                    .orElse(UserCategoryRank.builder()
                            .user(user)
                            .category(category)
                            .rankPoint(0)
                            .totalMatches(0)
                            .totalWins(0)
                            .currentWinStreak(0)
                            .build());

            int currentPoints = userRank.getRankPoint() != null ? userRank.getRankPoint() : 0;

            int pointChange = calculatePointChange(currentPoints, userRank, isWinner);

            if (isWinner && userRank.getCurrentWinStreak() >= 2) {
                pointChange += 5;
            }

            int newPoints = currentPoints + pointChange;
            if (!isWinner && currentPoints < 3000) {
                int currentTierMinPoints = (currentPoints / 500) * 500;
                if (newPoints < currentTierMinPoints) {
                    newPoints = currentTierMinPoints;
                }
            }

            userRank.setRankPoint(Math.max(0, newPoints));
            userRank.setTotalMatches(userRank.getTotalMatches() + 1);

            if (isWinner) {
                userRank.setTotalWins(userRank.getTotalWins() + 1);
                userRank.setCurrentWinStreak(userRank.getCurrentWinStreak() + 1);
            } else {
                userRank.setCurrentWinStreak(0);
            }

            userCategoryRankRepository.save(userRank);

            int actualChange = userRank.getRankPoint() - currentPoints;
            pointChangesLog.put(userId, actualChange);
        }

        result.setRankChanges(pointChangesLog);
    }

    private int calculatePointChange(int currentPoints, UserCategoryRank userRank, boolean isWinner) {
        int tierIndex = Math.min(currentPoints / 500, 6);

        int gain;
        int loss;

        switch (tierIndex) {
            case 0:
            case 1:
                gain = 30;
                loss = -10;
                break;
            case 2:
            case 3:
                gain = 25;
                loss = -15;
                break;
            case 4:
                gain = 20;
                loss = -20;
                break;
            case 5:
                gain = 15;
                loss = -25;
                double winRate = userRank.getTotalMatches() > 0
                        ? (double) userRank.getTotalWins() / userRank.getTotalMatches() : 0.5;

                if (winRate > 0.55) {
                    gain += 5;
                    loss += 5;
                } else if (winRate < 0.45) {
                    gain -= 5;
                    loss -= 5;
                }
                break;
            default:
                gain = 10;
                loss = -30;
                break;
        }

        return isWinner ? gain : loss;
    }

    private void processBetMatch(MatchResult result) {
        Match match = result.getMatch();

        log.info("=== ĐÃ CHỐT KẾT QUẢ TRẬN KÈO ===", match.getMatchId());
        log.info("Phần thưởng kèo: {}", match.getNote() != null ? match.getNote() : "Không ghi rõ");
    }

    private void processCreditScore(MatchResult result) {
        List<MatchRegistration> registrations = registrationRepository.findByMatch(result.getMatch());
        List<UUID> absents = result.getAbsentUserIds() != null ? result.getAbsentUserIds() : new ArrayList<>();

        String categoryName = result.getMatch().getCategory() != null
                ? result.getMatch().getCategory().getCategoryName() : "Thể thao";

        for (MatchRegistration reg : registrations) {
            User user = reg.getUser();

            if (absents.contains(user.getUserId())) {
                updateCreditScore(user, -20, "Vắng mặt không báo trước trong trận " + categoryName);
            } else {
                updateCreditScore(user, 5, "Hoàn thành trận " + categoryName);
            }
        }
    }

    private void updateCreditScore(User user, int pointsChanged, String reason) {
        int currentScore = user.getCreditScore() != null ? user.getCreditScore() : 100;
        int newScore = currentScore + pointsChanged;

        if (newScore > 100) newScore = 100;
        if (newScore < 0) newScore = 0;

        if (currentScore != newScore) {
            user.setCreditScore(newScore);
            userRepository.save(user);

            ReputationLog log = ReputationLog.builder()
                    .user(user)
                    .pointsChanged(newScore - currentScore)
                    .reason(reason)
                    .build();
            reputationLogRepository.save(log);
        }
    }
}