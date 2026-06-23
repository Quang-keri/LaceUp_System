package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.*;
import org.sport.backend.dto.request.match.MatchResultRequest;
import org.sport.backend.dto.request.match.ReportRequest;
import org.sport.backend.dto.response.match.AbsentReportNotificationResponse;
import org.sport.backend.dto.response.match.MatchResultResponse;
import org.sport.backend.dto.response.notification.ReportNotificationResponse;
import org.sport.backend.entity.*;
import org.sport.backend.event.MatchResultApprovedEvent;
import org.sport.backend.mapper.MatchResultMapper;
import org.sport.backend.repository.*;
import org.sport.backend.service.MatchResultService;
import org.sport.backend.service.UserService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchResultServiceImpl implements MatchResultService {

    private final MatchResultRepository matchResultRepository;
    private final MatchRepository matchRepository;
    private final MatchRegistrationRepository registrationRepository;
    private final MatchReportRepository matchReportRepository;
    private final UserRepository userRepository;
    private final ReputationLogRepository reputationLogRepository;
    private final UserCategoryRankRepository userCategoryRankRepository;
    private final SlotRepository slotRepository;
    private final PaymentRepository paymentRepository;

    private final UserService userService;

    private final MatchResultMapper matchResultMapper;

    private final ApplicationEventPublisher eventPublisher;

    private final SimpMessagingTemplate messagingTemplate;

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

        boolean isOpponentCompletelyAbsent = false;
        List<UUID> absentIds = request.getAbsentUserIds() != null ? request.getAbsentUserIds() : new ArrayList<>();

        if (!loserIds.isEmpty() && !absentIds.isEmpty()) {
            isOpponentCompletelyAbsent = new HashSet<>(absentIds).containsAll(loserIds);
        }

        if (absentIds.contains(currentUser.getUserId())) {
            throw new RuntimeException("Lỗi: Người chơi vắng mặt không thể thao tác gửi kết quả. Chỉ người có mặt mới được thực hiện!");
        }

        if (isOpponentCompletelyAbsent) {
            MatchResult result = MatchResult.builder()
                    .match(match)
                    .submitterId(currentUser.getUserId())
                    .winningTeamNumber(winningTeam)
                    .winnerIds(winnerIds)
                    .loserIds(loserIds)
                    .status(ResultStatus.DISPUTED)
                    .absentUserIds(absentIds)
                    .build();

            match.setStatus(MatchStatus.WAITING_RESULT_APPROVAL);
            matchRepository.save(match);

            MatchResult savedResult = matchResultRepository.save(result);

            notifyCourtOwnerAboutAbsence(savedResult);
            eventPublisher.publishEvent(new MatchResultApprovedEvent(savedResult));

            log.info("Trận đấu [{}] đã tự động chốt kết quả do đối thủ vắng mặt toàn bộ.", match.getMatchId());
            MatchResultResponse response = matchResultMapper.toResponse(savedResult);
            response.setMessage("Đã ghi nhận vắng mặt. Đang chờ Chủ sân xác nhận!");
            return response;

        } else {
            MatchResult result = MatchResult.builder()
                    .match(match)
                    .submitterId(currentUser.getUserId())
                    .winningTeamNumber(winningTeam)
                    .winnerIds(winnerIds)
                    .loserIds(loserIds)
                    .status(ResultStatus.PENDING)
                    .absentUserIds(absentIds)
                    .build();

            match.setStatus(MatchStatus.WAITING_RESULT_APPROVAL);
            matchRepository.save(match);

            return matchResultMapper.toResponse(matchResultRepository.save(result));
        }
    }

    @Override
    @Transactional
    public MatchResultResponse respondToResult(UUID resultId, boolean isAccepted) {
        User currentUser = userService.getCurrentUserEntity();
        MatchResult result = matchResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo kết quả này"));

        Match match = result.getMatch();

        // 1. KIỂM TRA AI ĐANG GỌI API (CHỦ SÂN HAY NGƯỜI CHƠI?)
        boolean isOwner = match.getCourt() != null && match.getCourt().getRentalArea() != null &&
                match.getCourt().getRentalArea().getOwner().getUserId().equals(currentUser.getUserId());

        if (isOwner) {
            // ---> QUYỀN CHỦ SÂN: Chỉ duyệt những ca đang Tranh Chấp (DISPUTED)
            if (result.getStatus() != ResultStatus.DISPUTED) {
                throw new RuntimeException("Chủ sân chỉ được duyệt kết quả khi có tranh chấp (DISPUTED)!");
            }
        } else {
            // ---> QUYỀN NGƯỜI CHƠI: Duyệt bình thường (PENDING)
            if (result.getStatus() != ResultStatus.PENDING) {
                throw new RuntimeException("Kết quả này đã được xử lý!");
            }

            MatchRegistration currentReg = registrationRepository.findByMatchAndUser(match, currentUser)
                    .orElseThrow(() -> new RuntimeException("Chỉ người tham gia mới được duyệt kết quả!"));

            if (result.getAbsentUserIds() != null && result.getAbsentUserIds().contains(currentUser.getUserId())) {
                throw new RuntimeException("Hệ thống ghi nhận bạn đã vắng mặt ở trận này, không thể duyệt kết quả!");
            }

            MatchRegistration submitterReg = registrationRepository.findByMatchAndUser_UserId(match, result.getSubmitterId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin người gửi kết quả"));

            if (currentReg.getTeamNumber() != null && currentReg.getTeamNumber().equals(submitterReg.getTeamNumber())) {
                throw new RuntimeException("Chỉ người thuộc đội đối thủ mới có quyền duyệt kết quả này!");
            }
        }

        // 2. THỰC THI CHỐT KẾT QUẢ
        if (isAccepted) {
            result.setStatus(ResultStatus.APPROVED);
            match.setStatus(MatchStatus.COMPLETED);

            // Các hàm cộng/trừ điểm sẽ chạy khi được duyệt
            processCreditScore(result);

            if (match.getMatchType() == MatchType.RANKED) {
                processRankedMatch(result);
            } else if (match.getMatchType() == MatchType.BET) {
                processBetMatch(result);
            }

            notifyCourtOwnerAboutAbsence(result);
            eventPublisher.publishEvent(new MatchResultApprovedEvent(result));
        } else {
            // Nếu bị từ chối
            result.setStatus(ResultStatus.REJECTED);
            if (isOwner) {
                match.setStatus(MatchStatus.WAITING_RESULT_APPROVAL); // Chủ sân từ chối -> Quay lại chờ User chốt lại
            } else {
                match.setStatus(MatchStatus.DISPUTED); // Đối thủ từ chối -> Báo động Tranh chấp
            }
        }

        matchRepository.save(match);
        return matchResultMapper.toResponse(matchResultRepository.save(result));
    }

    @Transactional
    @Override
    public void createMatchReport(ReportRequest request) {
        User currentUser = userService.getCurrentUserEntity();
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        MatchRegistration reporterReg = registrationRepository.findByMatchAndUser(match, currentUser)
                .orElseThrow(() -> new RuntimeException("Bạn không tham gia trận đấu này!"));

        if (reporterReg.getIsPaid() == null || !reporterReg.getIsPaid()) {
            throw new RuntimeException("Bạn chưa hoàn tất thanh toán tiền sân. Chỉ những người chơi đã đóng tiền mới có quyền báo cáo hoặc yêu cầu hủy trận!");
        }

        List<UUID> reportedIds = request.getReportedUserIds();
        if (reportedIds != null && reportedIds.contains(currentUser.getUserId())) {
            throw new RuntimeException("Bạn không thể tự báo cáo vi phạm cho chính mình!");
        }

        MatchReport report = MatchReport.builder()
                .match(match)
                .reporter(currentUser)
                .reportedUserIds(request.getReportedUserIds())
                .reasonType(request.getReasonType())
                .description(request.getDescription())
                .evidenceImages(request.getEvidenceImages())
                .status(MatchReportStatus.PENDING)
                .build();

        matchReportRepository.save(report);

        notifyCourtOwnerAboutReport(report, currentUser);

        log.info("Đã lưu báo cáo vi phạm từ user [{}] cho trận [{}]",
                currentUser.getUserName(), match.getMatchId());
    }

    @Transactional
    @Override
    public void resolveMatchReport(UUID reportId, boolean isAccepted) {
        User currentUser = userService.getCurrentUserEntity();
        MatchReport report = matchReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo"));

        if (report.getStatus() != MatchReportStatus.PENDING) {
            throw new RuntimeException("Báo cáo này đã được xử lý!");
        }

        Match match = report.getMatch();
        Court court = match.getCourt();

        if (court == null || court.getRentalArea() == null ||
                !court.getRentalArea().getOwner().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Chỉ chủ sân mới có quyền duyệt báo cáo này!");
        }

        if (!isAccepted) {
            report.setStatus(MatchReportStatus.REJECTED);
            matchReportRepository.save(report);
            log.info("Chủ sân [{}] đã TỪ CHỐI báo cáo vi phạm cho trận [{}]", currentUser.getUserName(), match.getMatchId());
            return;
        }

        report.setStatus(MatchReportStatus.RESOLVED);
        matchReportRepository.save(report);

        List<UUID> reportedIds = report.getReportedUserIds() != null ? report.getReportedUserIds() : new ArrayList<>();

        if (!reportedIds.isEmpty()) {
            List<User> reportedUsers = userRepository.findAllById(reportedIds);

            if (reportedUsers.isEmpty()) {
                log.warn("⚠️ Không tìm thấy User bằng ID trực tiếp. Đang thử convert từ RegistrationID sang UserID...");
                List<MatchRegistration> regs = registrationRepository.findAllById(reportedIds);
                reportedUsers = regs.stream().map(MatchRegistration::getUser).toList();

                reportedIds = reportedUsers.stream().map(User::getUserId).toList();
            }

            for (User u : reportedUsers) {
                updateCreditScore(u, -20, "Vi phạm trong trận (Lý do: " + report.getReasonType() + ") - Owner xác nhận");
                log.info("💥 Đã trừ 20 điểm uy tín của User [{}]", u.getUserId());
            }
        }

        if (match.getMatchType() == MatchType.RANKED && match.getCategory() != null) {
            List<MatchRegistration> registrations = registrationRepository.findByMatch(match);

            Map<Integer, List<MatchRegistration>> teamMap = registrations.stream()
                    .filter(reg -> reg.getTeamNumber() != null)
                    .collect(Collectors.groupingBy(MatchRegistration::getTeamNumber));

            for (Map.Entry<Integer, List<MatchRegistration>> entry : teamMap.entrySet()) {
                List<MatchRegistration> teamRegs = entry.getValue();

                List<UUID> finalReportedIds = reportedIds;
                List<MatchRegistration> reportedInTeam = teamRegs.stream()
                        .filter(reg -> finalReportedIds.contains(reg.getUser().getUserId()))
                        .toList();

                List<UUID> finalReportedIds1 = reportedIds;
                List<MatchRegistration> innocentInTeam = teamRegs.stream()
                        .filter(reg -> !finalReportedIds1.contains(reg.getUser().getUserId()))
                        .toList();

                if (!reportedInTeam.isEmpty()) {
                    for (MatchRegistration guiltyReg : reportedInTeam) {
                        User guiltyUser = guiltyReg.getUser();
                        UserCategoryRank guiltyRank = userCategoryRankRepository
                                .findByUser_UserIdAndCategory_CategoryId(guiltyUser.getUserId(), match.getCategory().getCategoryId())
                                .orElse(UserCategoryRank.builder()
                                        .user(guiltyUser)
                                        .category(match.getCategory())
                                        .rankPoint(0)
                                        .totalMatches(0)
                                        .totalWins(0)
                                        .currentWinStreak(0)
                                        .build());

                        int currentPoints = guiltyRank.getRankPoint() != null ? guiltyRank.getRankPoint() : 0;
                        int penaltyPoints = 30;

                        guiltyRank.setRankPoint(Math.max(0, currentPoints - penaltyPoints));
                        guiltyRank.setCurrentWinStreak(0);
                        userCategoryRankRepository.save(guiltyRank);

                        log.info("Đã TRỪ {} điểm Rank của user [{}] vì vi phạm/bỏ bom trong trận RANKED.", penaltyPoints, guiltyUser.getUserId());
                    }
                }

                if (!reportedInTeam.isEmpty() && !innocentInTeam.isEmpty()) {
                    for (MatchRegistration innocentReg : innocentInTeam) {
                        User teammateUser = innocentReg.getUser();

                        UserCategoryRank teammateRank = userCategoryRankRepository
                                .findByUser_UserIdAndCategory_CategoryId(teammateUser.getUserId(), match.getCategory().getCategoryId())
                                .orElse(UserCategoryRank.builder()
                                        .user(teammateUser)
                                        .category(match.getCategory())
                                        .rankPoint(0)
                                        .totalMatches(0)
                                        .totalWins(0)
                                        .currentWinStreak(0)
                                        .build());

                        int currentPoints = teammateRank.getRankPoint() != null ? teammateRank.getRankPoint() : 0;

                        int compensationPoints = 10;
                        teammateRank.setRankPoint(currentPoints + compensationPoints);
                        userCategoryRankRepository.save(teammateRank);

                        log.info("Đã đền bù {} điểm Rank cho user [{}] vì bị đồng đội bỏ bom trong trận RANKED.", compensationPoints, teammateUser.getUserId());
                    }
                }
            }
        }
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
                UserCategoryRank absentRank = userCategoryRankRepository
                        .findByUser_UserIdAndCategory_CategoryId(userId, category.getCategoryId())
                        .orElse(UserCategoryRank.builder()
                                .user(user)
                                .category(category)
                                .rankPoint(0)
                                .totalMatches(0)
                                .totalWins(0)
                                .currentWinStreak(0)
                                .build());

                int currentPoints = absentRank.getRankPoint() != null ? absentRank.getRankPoint() : 0;
                int penaltyPoints = 30;

                absentRank.setRankPoint(Math.max(0, currentPoints - penaltyPoints));
                absentRank.setCurrentWinStreak(0);
                absentRank.setTotalMatches(absentRank.getTotalMatches() + 1);
                userCategoryRankRepository.save(absentRank);

                pointChangesLog.put(userId, -penaltyPoints);
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
                    .createdAt(LocalDateTime.now())
                    .build();
            reputationLogRepository.save(log);
        }
    }

    private void notifyCourtOwnerAboutAbsence(MatchResult result) {
        List<UUID> absentIds = result.getAbsentUserIds();
        if (absentIds == null || absentIds.isEmpty()) {
            return;
        }

        Match match = result.getMatch();
        Court court = match.getCourt();

        if (court == null) {
            return;
        }

        User courtOwner = court.getRentalArea().getOwner();
        if (courtOwner == null) {
            log.warn("Không tìm thấy chủ sân cho courtId: {}", court.getCourtId());
            return;
        }

        List<User> absentUsers = userRepository.findAllById(absentIds);
        List<AbsentReportNotificationResponse.AbsentUserInfo> absentUserInfoList = absentUsers.stream()
                .map(u -> AbsentReportNotificationResponse.AbsentUserInfo.builder()
                        .userId(u.getUserId())
                        .userName(u.getUserName())
                        .phoneNumber(u.getPhone())
                        .email(u.getEmail())
                        .build())
                .collect(Collectors.toList());

        AbsentReportNotificationResponse notification = AbsentReportNotificationResponse.builder()
                .matchId(match.getMatchId())
                .courtId(court.getCourtId())
                .courtName(court.getCourtName())
                .roomCode(match.getRoomCode())
                .matchStartTime(match.getStartTime())
                .matchEndTime(match.getEndTime())
                .reportedAt(LocalDateTime.now())
                .absentUsers(absentUserInfoList)
                .message("Có " + absentUsers.size() + " người chơi vắng mặt trong trận đấu tại sân của bạn.")
                .build();

        String destination = "/queue/notifications/" + courtOwner.getUserId();
        messagingTemplate.convertAndSend(destination, notification);

        log.info("Đã gửi báo cáo vắng mặt trận {} cho chủ sân {}", match.getMatchId(), courtOwner.getUserId());
    }

    private void notifyCourtOwnerAboutReport(MatchReport report, User reporter) {
        Match match = report.getMatch();
        Court court = match.getCourt();

        if (court == null || court.getRentalArea() == null || court.getRentalArea().getOwner() == null) {
            return;
        }

        User courtOwner = court.getRentalArea().getOwner();

        ReportNotificationResponse notification = ReportNotificationResponse.builder()
                .type("VIOLATION_REPORT")
                .reportId(report.getReportId())
                .matchId(match.getMatchId())
                .roomCode(match.getRoomCode())
                .courtName(court.getCourtName())
                .reporterName(reporter.getUserName())
                .reasonType(report.getReasonType())
                .message("Có người chơi vừa gửi báo cáo vi phạm tại sân của bạn!")
                .reportedAt(LocalDateTime.now())
                .build();

        // Bắn vào topic riêng của Chủ sân
        String destination = "/queue/notifications/" + courtOwner.getUserId();
        messagingTemplate.convertAndSend(destination, notification);

        log.info("Đã gửi thông báo báo cáo vi phạm trận {} cho chủ sân {}", match.getMatchId(), courtOwner.getUserId());
    }

}
