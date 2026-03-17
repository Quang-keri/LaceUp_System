package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.dto.request.match.MatchRequest;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.MatchRegistration;
import org.sport.backend.entity.User;
import org.sport.backend.mapper.MatchMapper;
import org.sport.backend.repository.CourtRepository;
import org.sport.backend.repository.MatchRegistrationRepository;
import org.sport.backend.repository.MatchRepository;
import org.sport.backend.service.MatchService;
import org.sport.backend.specification.MatchSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchServiceImpl implements MatchService {

    private final MatchRepository matchRepository;
    private final MatchRegistrationRepository registrationRepository;
    private final CourtRepository courtRepository;
    private final MatchMapper matchMapper;

    @Override
    @Transactional
    public MatchResponse createMatch(MatchRequest request, User host) {

        Court court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sân này"));

        Match match = Match.builder()
                .court(court)
                .host(host)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxPlayers(request.getMaxPlayers())
                .minPlayersToStart(request.getMinPlayersToStart())
                .currentPlayers(0)
                .status(MatchStatus.OPEN)
                .isRecurring(request.isRecurring())
                .build();

        Match savedMatch = matchRepository.save(match);
        return matchMapper.toResponse(savedMatch);
    }

    @Override
    @Transactional
    public void joinMatch(UUID matchId, User user) {
        // Sử dụng Lock để tránh Race Condition (nhiều người cùng tranh 1 slot cuối)
        Match match = matchRepository.findByIdWithLock(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            throw new RuntimeException("Trận đấu đã đủ người!");
        }

        boolean alreadyJoined = registrationRepository.existsByMatchAndUser(match, user);
        if (alreadyJoined) {
            throw new RuntimeException("Bạn đã tham gia trận này rồi");
        }

        MatchRegistration reg = MatchRegistration.builder()
                .user(user)
                .match(match)
                .registeredAt(LocalDateTime.now())
                .build();
        registrationRepository.save(reg);

        // Cập nhật số lượng
        match.setCurrentPlayers(match.getCurrentPlayers() + 1);

        // Cập nhật trạng thái dựa trên số lượng người join
        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            match.setStatus(MatchStatus.FULL);
        } else if (match.getCurrentPlayers() >= match.getMinPlayersToStart()) {
            match.setStatus(MatchStatus.CONFIRMED);
        }

        matchRepository.save(match);
    }

    @Override
    public List<MatchResponse> getOpenMatches() {
        return matchMapper.toResponseList(
                matchRepository.findByStatusIn(List.of(MatchStatus.OPEN, MatchStatus.CONFIRMED, MatchStatus.FULL))
        );
    }

    @Override
    public MatchResponse getMatchDetail(UUID matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));
        return matchMapper.toResponse(match);
    }

    @Override
    public PageResponse<MatchResponse> getAllMatches(
            int page, int size, MatchStatus status, String category,
            String keyword, LocalDateTime start, LocalDateTime end) {

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        Specification<Match> spec = Specification.where(MatchSpecifications.fetchAllDetails())
                .and(MatchSpecifications.hasStatus(status))
                .and(MatchSpecifications.hasCategory(category))
                .and(MatchSpecifications.searchByCourtName(keyword))
                .and(MatchSpecifications.isWithinTimeRange(start, end));

        Page<Match> matchPage = matchRepository.findAll(spec, pageable);

        List<MatchResponse> dtoList = matchMapper.toResponseList(matchPage.getContent());

        return PageResponse.<MatchResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(matchPage.getTotalPages())
                .totalElements(matchPage.getTotalElements())
                .data(dtoList)
                .build();
    }
}
