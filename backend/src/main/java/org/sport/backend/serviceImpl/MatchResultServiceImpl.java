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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchResultServiceImpl implements MatchResultService {

    private final MatchResultRepository matchResultRepository;
    private final MatchRepository matchRepository;
    private final MatchRegistrationRepository registrationRepository;
    private final UserStatsRepository userStatsRepository;
    private final UserRepository userRepository;
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

        MatchResult result = MatchResult.builder()
                .match(match)
                .submitterId(currentUser.getUserId())
                .winnerIds(request.getWinnerIds())
                .loserIds(request.getLoserIds())
                .status(ResultStatus.PENDING)
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

        if (currentUser.getUserId().equals(result.getSubmitterId())) {
            throw new RuntimeException("Bạn không thể tự duyệt kết quả do mình gửi!");
        }

        if (!registrationRepository.existsByMatchAndUser(match, currentUser)) {
            throw new RuntimeException("Chỉ người tham gia mới được duyệt kết quả!");
        }

        if (isAccepted) {
            result.setStatus(ResultStatus.APPROVED);
            match.setStatus(MatchStatus.COMPLETED);

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

    // --- LOGIC RANK ---
    private void processRankedMatch(MatchResult result) {
        List<MatchRegistration> registrations = registrationRepository.findByMatch(result.getMatch());
        List<UUID> winners = result.getWinnerIds();
        List<UUID> losers = result.getLoserIds();

        for (MatchRegistration reg : registrations) {
            User user = reg.getUser();
            UserStats stats = userStatsRepository.findById(user.getUserId())
                    .orElse(UserStats.builder().user(user).build());

            int currentPoints = user.getRankPoint() != null ? user.getRankPoint() : 0;
            boolean isWinner = winners.contains(user.getUserId());

            // 1. Tính toán điểm cộng/trừ dựa trên độ khó và tỉ lệ thắng
            int pointChange = calculatePointChange(currentPoints, stats, isWinner);

            // 2. Cập nhật điểm mới
            int newPoints = currentPoints + pointChange;

            // 3. LOGIC BẢO VỆ RỚT HẠNG (Chỉ áp dụng dưới 3000 điểm)
            if (!isWinner && currentPoints < 3000) {
                int currentTierMinPoints = (currentPoints / 500) * 500; // Đáy của rank hiện tại (VD: Vàng là 1500)

                // Nếu điểm mới rơi xuống dưới đáy Rank hiện tại -> Giữ lại ở mức đáy (Không rớt hạng)
                if (newPoints < currentTierMinPoints) {
                    newPoints = currentTierMinPoints;
                }
            }

            user.setRankPoint(Math.max(0, newPoints)); // Đảm bảo điểm không bao giờ âm
            userRepository.save(user);

            // Cập nhật Stats
            stats.setTotalMatches(stats.getTotalMatches() + 1);
            if (isWinner) {
                stats.setTotalWins(stats.getTotalWins() + 1);
                stats.setCurrentWinStreak(stats.getCurrentWinStreak() + 1);
            } else {
                stats.setCurrentWinStreak(0);
            }
            userStatsRepository.save(stats);
        }
    }

    private int calculatePointChange(int currentPoints, UserStats stats, boolean isWinner) {
        int tierIndex = Math.min(currentPoints / 500, 6); // 0=Sắt, 5=Kim Cương, 6=Cao Thủ+

        int gain = 0;
        int loss = 0;

        // Càng lên cao, cộng càng ít, trừ càng nhiều
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
                // Ở Kim Cương, áp dụng thêm Win Rate (Tỉ lệ thắng)
                double winRate = stats.getTotalMatches() > 0
                        ? (double) stats.getTotalWins() / stats.getTotalMatches() : 0.5;

                if (winRate > 0.55) { // Đánh hay, tỉ lệ thắng cao -> Cho lên rank nhanh hơn
                    gain += 5;
                    loss += 5; // Trừ ít đi (Ví dụ: -25 + 5 = -20)
                } else if (winRate < 0.45) { // Thua nhiều -> Phạt nặng hơn
                    gain -= 5;
                    loss -= 5; // Trừ nặng hơn (Ví dụ: -25 - 5 = -30)
                }
                break;
            default: // Cao Thủ trở lên (>= 3000)
                gain = 10;
                loss = -30; // Chế độ sinh tồn khắc nghiệt
                break;
        }

        return isWinner ? gain : loss;
    }

    private void processBetMatch(MatchResult result) {
        Match match = result.getMatch();
        if (match.getCourt() == null || match.getStartTime() == null || match.getEndTime() == null) return;

        // 1. Tính tổng tiền sân dựa trên khung giờ
        BigDecimal totalPrice = calculateTotalCourtPrice(match);

        // 2. Tính tỷ lệ chia tiền (WinnerPercent là % phe Thắng phải trả)
        double winnerPercentVal = match.getWinnerPercent() != null ? match.getWinnerPercent() : 50.0;
        BigDecimal winnerRatio = BigDecimal.valueOf(winnerPercentVal).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal loserRatio = BigDecimal.ONE.subtract(winnerRatio);

        List<UUID> winners = result.getWinnerIds();
        List<UUID> losers = result.getLoserIds();

        // 3. Tính toán số tiền mỗi cá nhân phải trả
        BigDecimal payPerWinner = calculatePayPerPerson(totalPrice, winnerRatio, winners);
        BigDecimal payPerLoser = calculatePayPerPerson(totalPrice, loserRatio, losers);

        // 4. Thực hiện trừ tiền trực tiếp vào ví giả (fakeMoney)
        updateUserWallets(winners, payPerWinner, "Trừ tiền sân (Phe Thắng - " + winnerPercentVal + "%)");
        updateUserWallets(losers, payPerLoser, "Trừ tiền sân (Phe Thua - " + (100 - winnerPercentVal) + "%)");

        log.info("=== ĐÃ TRỪ TIỀN KÈO TRẬN {} ===", match.getMatchId());
        log.info("Tổng: {} VNĐ | Thắng trả: {}/ng | Thua trả: {}/ng", totalPrice, payPerWinner, payPerLoser);
    }

    private BigDecimal calculatePayPerPerson(BigDecimal total, BigDecimal ratio, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return BigDecimal.ZERO;
        BigDecimal totalSidePay = total.multiply(ratio);
        return totalSidePay.divide(BigDecimal.valueOf(ids.size()), 0, RoundingMode.HALF_UP);
    }

    private void updateUserWallets(List<UUID> userIds, BigDecimal amount, String reason) {
        if (userIds == null || userIds.isEmpty() || amount.compareTo(BigDecimal.ZERO) <= 0) return;

        List<User> users = userRepository.findAllById(userIds);

        for (User user : users) {
            BigDecimal currentBalance = user.getFakeMoney() != null ? user.getFakeMoney() : BigDecimal.ZERO;

            user.setFakeMoney(currentBalance.subtract(amount));

            log.info("[Wallet Update] User: {} | Amount: -{} | Reason: {} | New Balance: {}",
                    user.getUserName(), amount, reason, user.getFakeMoney());
        }
        userRepository.saveAll(users);
    }

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

        // Tính số giờ (Duration)
        long durationMinutes = java.time.Duration.between(match.getStartTime(), match.getEndTime()).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(durationMinutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        return pricePerHour.multiply(hours);
    }
}