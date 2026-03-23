package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.constant.MatchType;
import org.sport.backend.constant.ResultStatus;
import org.sport.backend.dto.request.match.MatchResultRequest;
import org.sport.backend.dto.response.match.MatchResultResponse;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.MatchResult;
import org.sport.backend.entity.User;
import org.sport.backend.mapper.MatchResultMapper;
import org.sport.backend.repository.MatchRegistrationRepository;
import org.sport.backend.repository.MatchRepository;
import org.sport.backend.repository.MatchResultRepository;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.MatchResultService;
import org.sport.backend.service.UserService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
            int currentRank = user.getRankPoint() != null ? user.getRankPoint() : 3000;

            if (winners.contains(user.getUserId())) {
                user.setRankPoint(currentRank + 25);
            } else if (losers.contains(user.getUserId())) {
                user.setRankPoint(Math.max(0, currentRank - 25));
            }
            userRepository.save(user);
        }
    }

    private void processBetMatch(MatchResult result) {
        Match match = result.getMatch();
        if (match.getCourt() == null || match.getCourt().getPrice() == null) return;

        BigDecimal totalPrice = match.getCourt().getPrice();

        double winnerPercentVal = match.getWinnerPercent() != null ? match.getWinnerPercent() : 50.0;

        BigDecimal winnerRatio = BigDecimal.valueOf(winnerPercentVal)
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal loserRatio = BigDecimal.ONE.subtract(winnerRatio);

        List<UUID> winners = result.getWinnerIds();
        List<UUID> losers = result.getLoserIds();

        BigDecimal payPerWinner = BigDecimal.ZERO;
        if (winners != null && !winners.isEmpty()) {
            BigDecimal totalWinnerPay = totalPrice.multiply(winnerRatio);
            payPerWinner = totalWinnerPay.divide(BigDecimal.valueOf(winners.size()), 2, RoundingMode.HALF_UP);
        }

        BigDecimal payPerLoser = BigDecimal.ZERO;
        if (losers != null && !losers.isEmpty()) {
            BigDecimal totalLoserPay = totalPrice.multiply(loserRatio);
            payPerLoser = totalLoserPay.divide(BigDecimal.valueOf(losers.size()), 2, RoundingMode.HALF_UP);
        }

        log.info("=== KẾT QUẢ KÈO TRẬN {} ===", match.getMatchId());
        log.info("Phe Thắng trả: {} VNĐ/người", payPerWinner);
        log.info("Phe Thua trả: {} VNĐ/người", payPerLoser);

    }
}