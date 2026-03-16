package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.User;
import org.sport.backend.repository.MatchRegistrationRepository;
import org.sport.backend.repository.MatchRepository;
import org.sport.backend.service.MatchService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchServiceImpl implements MatchService {

    private final MatchRepository matchRepository;
    private final MatchRegistrationRepository registrationRepository;

    @Override
    @Transactional
    public Match createMatch(MatchRequest request, User host) {
        Match match = Match.builder()
                .court(request.getCourt()) // Giả sử đã mapping từ CourtId
                .host(host)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxPlayers(request.getMaxPlayers())
                .minPlayersToStart(request.getMinPlayersToStart())
                .currentPlayers(0) // Khởi tạo 0 hoặc 1 nếu chủ tham gia
                .status(MatchStatus.OPEN)
                .isRecurring(request.isRecurring())
                .build();
        return matchRepository.save(match);
    }

    @Override
    @Transactional
    public void joinMatch(UUID matchId, User user) {
        // Sử dụng lock để đảm bảo không bị tranh chấp slot
        Match match = matchRepository.findByIdWithLock(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        // 1. Kiểm tra slot
        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            throw new RuntimeException("Trận đấu đã đủ người!");
        }

        // 2. Kiểm tra xem người dùng đã join chưa
        boolean alreadyJoined = registrationRepository.existsByMatchAndUser(match, user);
        if (alreadyJoined) {
            throw new RuntimeException("Bạn đã tham gia trận này rồi");
        }

        // 3. Lưu đăng ký
        MatchRegistration reg = MatchRegistration.builder()
                .user(user)
                .match(match)
                .registeredAt(LocalDateTime.now())
                .build();
        registrationRepository.save(reg);

        // 4. Cập nhật số lượng và trạng thái
        match.setCurrentPlayers(match.getCurrentPlayers() + 1);

        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            match.setStatus(MatchStatus.FULL);
        } else if (match.getCurrentPlayers() >= match.getMinPlayersToStart()) {
            match.setStatus(MatchStatus.CONFIRMED);
        }

        matchRepository.save(match);
    }

    @Override
    public List<Match> getOpenMatches() {
        return matchRepository.findByStatus(MatchStatus.OPEN);
    }

    @Override
    public Match getMatchDetail(UUID matchId) {
        return matchRepository.findById(matchId).orElseThrow();
    }
}
