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
import org.sport.backend.mapper.MatchResultMapper;
import org.sport.backend.repository.*;
import org.sport.backend.service.MatchResultService;
import org.sport.backend.service.UserService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchResultServiceImpl implements MatchResultService {

    private final MatchResultRepository matchResultRepository;
    private final MatchRepository matchRepository;
    private final MatchRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final ReputationLogRepository reputationLogRepository;

    // THÊM: Repository mới để xử lý rank theo từng môn
    private final UserCategoryRankRepository userCategoryRankRepository;

    private final UserService userService;
    private final MatchResultMapper matchResultMapper;

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

        // --- BẮT ĐẦU LOGIC XỬ LÝ ĐỘI THẮNG ---
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
        // --- KẾT THÚC LOGIC LỌC ---

        MatchResult result = MatchResult.builder()
                .match(match)
                .submitterId(currentUser.getUserId())
                .winningTeamNumber(winningTeam) // Lưu lại Đội thắng
                .winnerIds(winnerIds)           // Vẫn lưu list ID để tái sử dụng logic tính Rank phía dưới
                .loserIds(loserIds)             // Vẫn lưu list ID
                .status(ResultStatus.PENDING)
                .absentUserIds(request.getAbsentUserIds())
                .build();

        // Cập nhật trạng thái trận đấu
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

        // CHẶN ĐỒNG ĐỘI TỰ DUYỆT (Bao gồm cả chính mình)
        if (currentReg.getTeamNumber() != null && currentReg.getTeamNumber().equals(submitterReg.getTeamNumber())) {
            throw new RuntimeException("Chỉ người thuộc đội đối thủ mới có quyền duyệt kết quả này!");
        }

        if (isAccepted) {
            result.setStatus(ResultStatus.APPROVED);
            match.setStatus(MatchStatus.COMPLETED);

//            refundDeposits(match);
            processCreditScore(result);

            // Xử lý cộng điểm hoặc chia tiền
            if (match.getMatchType() == MatchType.RANKED) {
                processRankedMatch(result);
            } else if (match.getMatchType() == MatchType.BET) {
                processBetMatch(result);
            }
        } else {
            result.setStatus(ResultStatus.REJECTED);
            match.setStatus(MatchStatus.DISPUTED); // Đưa trận đấu vào trạng thái tranh chấp
        }

        matchRepository.save(match);
        return matchResultMapper.toResponse(matchResultRepository.save(result));
    }

    @Override
    public List<MatchResultResponse> getResultsByMatch(UUID matchId) {
        return matchResultMapper.toResponseList(matchResultRepository.findByMatch_MatchId(matchId));
    }

    // --- LOGIC RANK --- ĐÃ CẬP NHẬT ĐỂ DÙNG UserCategoryRank ---
    private void processRankedMatch(MatchResult result) {
        Match match = result.getMatch();
        Court court = match.getCourt();

        // Kiểm tra an toàn: Đảm bảo trận đấu có sân và sân đó thuộc một môn thể thao (Category)
        if (court == null || court.getCategory() == null) {
            log.error("Lỗi cập nhật Rank: Trận đấu {} không xác định được môn thể thao", match.getMatchId());
            return;
        }

        Category category = court.getCategory();
        List<MatchRegistration> registrations = registrationRepository.findByMatch(match);
        List<UUID> winners = result.getWinnerIds();
        List<UUID> losers = result.getLoserIds();

        for (MatchRegistration reg : registrations) {
            User user = reg.getUser();
            boolean isWinner = winners.contains(user.getUserId());

            // 1. Tìm Rank của User ở môn thể thao này. Nếu chưa từng chơi, tạo mới mặc định
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

            // 2. Tính toán điểm cộng/trừ
            int pointChange = calculatePointChange(currentPoints, userRank, isWinner);

            // 3. Tính điểm mới và áp dụng LOGIC BẢO VỆ RỚT HẠNG
            int newPoints = currentPoints + pointChange;
            if (!isWinner && currentPoints < 3000) {
                int currentTierMinPoints = (currentPoints / 500) * 500;
                if (newPoints < currentTierMinPoints) {
                    newPoints = currentTierMinPoints;
                }
            }

            // 4. Lưu lại điểm mới (Đảm bảo không âm)
            userRank.setRankPoint(Math.max(0, newPoints));

            // 5. Cập nhật Stats riêng cho môn thể thao này
            userRank.setTotalMatches(userRank.getTotalMatches() + 1);
            if (isWinner) {
                userRank.setTotalWins(userRank.getTotalWins() + 1);
                userRank.setCurrentWinStreak(userRank.getCurrentWinStreak() + 1);
            } else {
                userRank.setCurrentWinStreak(0);
            }

            // 6. Lưu xuống DB
            userCategoryRankRepository.save(userRank);
        }
    }

    // Cập nhật tham số nhận vào là UserCategoryRank thay vì UserStats
    private int calculatePointChange(int currentPoints, UserCategoryRank userRank, boolean isWinner) {
        int tierIndex = Math.min(currentPoints / 500, 6); // 0=Sắt, 5=Kim Cương, 6=Cao Thủ+

        int gain = 0;
        int loss = 0;

        switch (tierIndex) {
            case 0: // Sắt
            case 1: // Đồng
                gain = 30;
                loss = -10;
                break;
            case 2: // Bạc
            case 3: // Vàng
                gain = 25;
                loss = -15;
                break;
            case 4: // Bạch Kim
                gain = 20;
                loss = -20;
                break;
            case 5: // Kim Cương
                gain = 15;
                loss = -25;
                // Tính tỉ lệ thắng trên rank của MÔN NÀY
                double winRate = userRank.getTotalMatches() > 0
                        ? (double) userRank.getTotalWins() / userRank.getTotalMatches() : 0.5;

                if (winRate > 0.55) {
                    gain += 5;
                    loss += 5; // Trừ ít đi
                } else if (winRate < 0.45) {
                    gain -= 5;
                    loss -= 5; // Trừ nặng hơn
                }
                break;
            default: // Cao Thủ trở lên
                gain = 10;
                loss = -30;
                break;
        }

        return isWinner ? gain : loss;
    }

//    // --- CÁC HÀM XỬ LÝ TIỀN CƯỢC / HOÀN CỌC GIỮ NGUYÊN ---
//    private void processBetMatch(MatchResult result) {
//        Match match = result.getMatch();
//        if (match.getCourt() == null || match.getStartTime() == null || match.getEndTime() == null) return;
//
//        BigDecimal totalPrice = calculateTotalCourtPrice(match);
//        double winnerPercentVal = match.getWinnerPercent() != null ? match.getWinnerPercent() : 50.0;
//        BigDecimal winnerRatio = BigDecimal.valueOf(winnerPercentVal).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
//        BigDecimal loserRatio = BigDecimal.ONE.subtract(winnerRatio);
//
//        List<UUID> winners = result.getWinnerIds();
//        List<UUID> losers = result.getLoserIds();
//
//        BigDecimal payPerWinner = calculatePayPerPerson(totalPrice, winnerRatio, winners);
//        BigDecimal payPerLoser = calculatePayPerPerson(totalPrice, loserRatio, losers);
//

    /// /        updateUserWallets(winners, payPerWinner, "Trừ tiền sân (Phe Thắng - " + winnerPercentVal + "%)");
    /// /        updateUserWallets(losers, payPerLoser, "Trừ tiền sân (Phe Thua - " + (100 - winnerPercentVal) + "%)");
//
//        log.info("=== ĐÃ TRỪ TIỀN KÈO TRẬN {} ===", match.getMatchId());
//        log.info("Tổng: {} VNĐ | Thắng trả: {}/ng | Thua trả: {}/ng", totalPrice, payPerWinner, payPerLoser);
//    }

    private void processBetMatch(MatchResult result) {
        Match match = result.getMatch();

        // Vì là kèo hiện vật (nước, bữa ăn) lưu trong trường 'note',
        // hệ thống không cần tính toán chia tiền sân hay trừ ví người dùng nữa.
        // Mọi khoản thanh toán tiền sân sẽ quay về mốc chia đều (nếu cọc) hoặc thanh toán trực tiếp cho chủ sân.

        log.info("=== ĐÃ CHỐT KẾT QUẢ TRẬN KÈO ===", match.getMatchId());
        log.info("Phần thưởng kèo: {}", match.getNote() != null ? match.getNote() : "Không ghi rõ");
    }

    private BigDecimal calculatePayPerPerson(BigDecimal total, BigDecimal ratio, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return BigDecimal.ZERO;
        BigDecimal totalSidePay = total.multiply(ratio);
        return totalSidePay.divide(BigDecimal.valueOf(ids.size()), 0, RoundingMode.HALF_UP);
    }

//    private void updateUserWallets(List<UUID> userIds, BigDecimal amount, String reason) {
//        if (userIds == null || userIds.isEmpty() || amount.compareTo(BigDecimal.ZERO) <= 0) return;
//
//        List<User> users = userRepository.findAllById(userIds);
//
//        for (User user : users) {
//            BigDecimal currentBalance = user.getFakeMoney() != null ? user.getFakeMoney() : BigDecimal.ZERO;
//
//            user.setFakeMoney(currentBalance.subtract(amount));
//
//            log.info("[TRANSACTION] - MINUS | Tác vụ: TRẢ TIỀN SÂN | User: {} ({}) | Số tiền: -{} VNĐ | Lý do: {} | Trận: {} | Số dư mới: {}",
//                    user.getUserName(),
//                    user.getUserId(),
//                    amount,
//                    reason,
//                    user.getFakeMoney());
//
//            log.info("[Wallet Update] User: {} | Amount: -{} | Reason: {} | New Balance: {}",
//                    user.getUserName(), amount, reason, user.getFakeMoney());
//        }
//        userRepository.saveAll(users);
//    }

    private BigDecimal calculateTotalCourtPrice(Match match) {
        List<CourtPrice> prices = match.getCourt().getCourtPrices();
        if (prices == null || prices.isEmpty()) return BigDecimal.ZERO;

        LocalTime matchStart = match.getStartTime().toLocalTime();
        LocalTime matchEnd = match.getEndTime().toLocalTime();

        CourtPrice courtPrice = prices.stream()
                .filter(p -> !matchStart.isBefore(p.getStartTime()) && !matchEnd.isAfter(p.getEndTime()))
                .findFirst()
                .orElse(prices.getFirst());

        BigDecimal pricePerHour = courtPrice.getPricePerHour();

        long durationMinutes = java.time.Duration.between(match.getStartTime(), match.getEndTime()).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(durationMinutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        return pricePerHour.multiply(hours);
    }

//    private void refundDeposits(Match match) {
//        BigDecimal totalPrice = calculateTotalCourtPrice(match);
//        BigDecimal depositAmount = BigDecimal.ZERO;
//
//        if (totalPrice.compareTo(BigDecimal.ZERO) > 0) {
//            depositAmount = totalPrice.divide(BigDecimal.valueOf(match.getMaxPlayers()), 0, RoundingMode.HALF_UP);
//        }
//
//        if (depositAmount.compareTo(BigDecimal.ZERO) <= 0) return;
//
//        List<MatchRegistration> regs = registrationRepository.findByMatch(match);
//        for (MatchRegistration reg : regs) {
//            if (reg.getIsDepositConfirmed()) {
//                User user = reg.getUser();
//                BigDecimal currentBalance = user.getFakeMoney() != null ? user.getFakeMoney() : BigDecimal.ZERO;
//
//                user.setFakeMoney(currentBalance.add(depositAmount));
//                userRepository.save(user);
//
//                log.info("[TRANSACTION] - PLUS | Tác vụ: HOÀN CỌC | User: {} ({}) | Số tiền: +{} VNĐ | Trận: {} | Số dư mới: {}",
//                        user.getUserName(),
//                        user.getUserId(),
//                        depositAmount,
//                        match.getMatchId(),
//                        user.getFakeMoney());
//
//                log.info("Đã hoàn cọc {} VNĐ cho user {}", depositAmount, user.getUserName());
//            }
//        }
//    }

    private void processCreditScore(MatchResult result) {
        List<MatchRegistration> registrations = registrationRepository.findByMatch(result.getMatch());
        List<UUID> absents = result.getAbsentUserIds() != null ? result.getAbsentUserIds() : new ArrayList<>();

        for (MatchRegistration reg : registrations) {
            User user = reg.getUser();

            if (absents.contains(user.getUserId())) {
                // Bị trừ nặng nếu vắng mặt
                updateCreditScore(user, -20, "Vắng mặt không báo trước trong trận " + result.getMatch().getCategory().getCategoryName());
            } else {
                // Hồi lại 5 điểm nếu tham gia đầy đủ (Áp dụng cho mọi loại trận)
                updateCreditScore(user, 5, "Hoàn thành trận " + result.getMatch().getCategory().getCategoryName());
            }
        }
    }

    private void updateCreditScore(User user, int pointsChanged, String reason) {
        int currentScore = user.getCreditScore() != null ? user.getCreditScore() : 100;
        int newScore = currentScore + pointsChanged;

        // Giới hạn điểm từ 0 đến 100
        if (newScore > 100) newScore = 100;
        if (newScore < 0) newScore = 0;

        // Chỉ lưu log và cập nhật nếu điểm có thay đổi (VD: Đang 100 mà cộng 5 thì không cần lưu)
        if (currentScore != newScore) {
            user.setCreditScore(newScore);
            userRepository.save(user);

            ReputationLog log = ReputationLog.builder()
                    .user(user)
                    .pointsChanged(newScore - currentScore) // Số điểm thực tế đã cộng/trừ
                    .reason(reason)
                    .build();
            reputationLogRepository.save(log);
        }
    }
}