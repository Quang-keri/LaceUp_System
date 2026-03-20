package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.constant.RecurringType;
import org.sport.backend.dto.request.match.MatchRequest;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.entity.*;
import org.sport.backend.mapper.MatchMapper;
import org.sport.backend.repository.CategoryRepository;
import org.sport.backend.repository.CourtRepository;
import org.sport.backend.repository.MatchRegistrationRepository;
import org.sport.backend.repository.MatchRepository;
import org.sport.backend.service.MatchService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.MatchSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchServiceImpl implements MatchService {

    private final MatchRepository matchRepository;
    private final MatchRegistrationRepository registrationRepository;
    private final CourtRepository courtRepository;
    private final CategoryRepository categoryRepository;
    private final MatchMapper matchMapper;

    private final UserService userService;


    @Override
    @Transactional
    public MatchResponse createMatch(MatchRequest request) {

        User currentUser = userService.getCurrentUserEntity();

        Match.MatchBuilder<?, ?> matchBuilder = Match.builder()
                .host(currentUser)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxPlayers(request.getMaxPlayers())
                .minPlayersToStart(request.getMinPlayersToStart())
                .currentPlayers(0)
                .status(MatchStatus.OPEN)
                .isRecurring(request.isRecurring())
                .recurringType(request.getRecurringType())
                .dayOfWeek(request.getDayOfWeek())
                .endDate(request.getEndDate());

        // Nếu có courtId (Owner tạo hoặc Renter chọn sân cụ thể)
        if (request.getCourtId() != null) {
            Court court = courtRepository.findById(request.getCourtId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sân này"));
            matchBuilder.court(court);
            matchBuilder.category(court.getCategory());
        } else {
            // Renter tạo kèo tìm người (Court = null)
            if (request.getCategoryId() == null) {
                throw new RuntimeException("Vui lòng chọn loại môn thể thao");
            }
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy loại môn thể thao này"));
            matchBuilder.category(category);
            matchBuilder.address(request.getAddress()); // Khu vực mong muốn (Quận 1, Quận 7...)
        }

        Match savedMatch = matchRepository.save(matchBuilder.build());

        if (currentUser.getRole().getRoleName().equals("RENTER")) joinMatch(savedMatch.getMatchId());
        return matchMapper.toResponse(savedMatch);
    }

    @Override
    @Transactional
    public void joinMatch(UUID matchId) {

        User currentUser = userService.getCurrentUserEntity();

        // Sử dụng Lock để tránh Race Condition (nhiều người cùng tranh 1 slot cuối)
        Match match = matchRepository.findByIdWithLock(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            throw new RuntimeException("Trận đấu đã đủ người!");
        }

        boolean alreadyJoined = registrationRepository.existsByMatchAndUser(match, currentUser);
        if (alreadyJoined) {
            throw new RuntimeException("Bạn đã tham gia trận này rồi");
        }

        MatchRegistration reg = MatchRegistration.builder()
                .user(currentUser)
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

    @Override
    public PageResponse<MatchResponse> getOwnerMatchesPaged(int page, int size) {
        // 1. Lấy thông tin Owner hiện tại từ Token
        User currentUser = userService.getCurrentUserEntity();

        // 2. Tạo pageable (Trang trong Spring Data JPA bắt đầu từ 0)
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        // 3. Gọi query lấy các trận đấu thuộc sân của Owner này
        Page<Match> matchPage = matchRepository.findByOwnerSystem(currentUser, pageable);

        // 4. Map sang DTO và trả về
        return PageResponse.<MatchResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(matchPage.getTotalPages())
                .totalElements(matchPage.getTotalElements())
                .data(matchMapper.toResponseList(matchPage.getContent()))
                .build();
    }

    @Transactional
    public void generateNextMatches() {
        List<Match> recurringConfigs = matchRepository.findByIsRecurringTrue();

        for (Match config : recurringConfigs) {
            for (int i = 1; i <= 7; i++) {
                LocalDate targetDate = LocalDate.now().plusDays(i);

                if (shouldCreateForDate(config, targetDate)) {
                    LocalDateTime targetStart = targetDate.atTime(config.getStartTime().toLocalTime());

                    boolean alreadyExists = matchRepository.existsByCourtAndStartTime(
                            config.getCourt(),
                            targetStart
                    );

                    if (!alreadyExists) {
                        createNewMatchInstance(config, targetDate);
                    }
                }
            }
        }
    }

    private boolean shouldCreateForDate(Match config, LocalDate date) {
        // Nếu không có cấu hình lặp lại cụ thể thì bỏ qua
        if (config.getRecurringType() == null) return false;

        // Nếu có ngày kết thúc và ngày hiện tại đã vượt quá ngày đó thì dừng lặp
        if (config.getEndDate() != null && date.isAfter(config.getEndDate())) {
            return false;
        }

        if (config.getRecurringType() == RecurringType.DAILY) return true;

        if (config.getRecurringType() == RecurringType.WEEKLY) {
            if (config.getDayOfWeek() == null) return false;
            String currentDay = date.getDayOfWeek().name();
            return config.getDayOfWeek().contains(currentDay);
        }
        return false;
    }

    private void createNewMatchInstance(Match config, LocalDate date) {
        // Tạo một bản sao của Match nhưng với ngày mới
        Match newMatch = Match.builder()
                .host(config.getHost())
                .court(config.getCourt())
                .category(config.getCategory())
                .startTime(date.atTime(config.getStartTime().toLocalTime()))
                .endTime(date.atTime(config.getEndTime().toLocalTime()))
                .status(MatchStatus.OPEN)
                .currentPlayers(0)
                .maxPlayers(config.getMaxPlayers())
                .isRecurring(false)
                .build();
        matchRepository.save(newMatch);
    }
}
