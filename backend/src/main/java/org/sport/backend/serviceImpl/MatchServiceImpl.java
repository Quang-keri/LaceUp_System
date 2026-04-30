package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.constant.MatchType;
import org.sport.backend.constant.RecurringType;
import org.sport.backend.dto.request.chat.DivideTeamRequest;
import org.sport.backend.dto.request.match.MatchRequest;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.entity.*;
import org.sport.backend.mapper.MatchMapper;
import org.sport.backend.repository.*;
import org.sport.backend.service.MatchService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.MatchSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private final UserRepository userRepository;
    private final CityRepository cityRepository;

    // THÊM REPOSITORY ĐỂ CHECK RANK THEO MÔN
    private final UserCategoryRankRepository userCategoryRankRepository;

    private final MatchMapper matchMapper;
    private final UserService userService;


    @Override
    @Transactional
    public MatchResponse createMatch(MatchRequest request) {

        User currentUser = userService.getCurrentUserEntity();

        if (request.getMatchType() == MatchType.RANKED) {
            if (request.getMinRank() == null || request.getMaxRank() == null) {
                throw new RuntimeException("Vui lòng nhập mức Rank tối thiểu và tối đa cho trận Rank");
            }
        }

        if (request.getMatchType() == MatchType.BET && request.getWinnerPercent() == null) {
            throw new RuntimeException("Vui lòng nhập tỉ lệ chia tiền sân cho trận Kèo (VD: 40, 0)");
        }

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
                .endDate(request.getEndDate())
                .matchType(request.getMatchType() != null ? request.getMatchType() : MatchType.NORMAL)
                .winnerPercent(request.getWinnerPercent())
                .minRank(request.getMinRank())
                .maxRank(request.getMaxRank());

        City city = cityRepository.getReferenceById(request.getCityId());
        Address address = Address.builder()
                .ward(request.getWard())
                .district(request.getDistrict())
                .street(request.getStreet())
                .city(city)
                .build();
        matchBuilder.address(address);

        if (request.getCourtId() != null) {
            Court court = courtRepository.findById(request.getCourtId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sân này"));
            matchBuilder.court(court);
            matchBuilder.category(court.getCategory());
        } else {
            if (request.getCategoryId() == null) {
                throw new RuntimeException("Vui lòng chọn loại môn thể thao");
            }
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy loại môn thể thao này"));
            matchBuilder.category(category);
        }

        Match savedMatch = matchRepository.save(matchBuilder.build());

        if (currentUser.getRole().getRoleName().equals("RENTER")) {
            joinMatch(savedMatch.getMatchId());
        }
        return matchMapper.toResponse(savedMatch);
    }

    @Override
    @Transactional
    public void joinMatch(UUID matchId) {
        User currentUser = userService.getCurrentUserEntity();
        Match match = matchRepository.findByIdWithLock(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        if (match.getStatus() == MatchStatus.WAITING_DEPOSIT ||
                match.getStatus() == MatchStatus.CONFIRMED ||
                match.getStatus() == MatchStatus.FULL) {
            throw new RuntimeException("Trận đấu đã đủ người hoặc đang trong quá trình chốt cọc!");
        }

        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            throw new RuntimeException("Trận đấu đã đủ người!");
        }

        // --- CHECK ĐIỀU KIỆN ĐÁNH RANK THEO CATEGORY ---
        if (match.getMatchType() == MatchType.RANKED) {
            Category category = match.getCategory();
            if (category == null) {
                throw new RuntimeException("Trận đấu không xác định được môn thể thao để xét Rank.");
            }

            // Lấy điểm rank của người dùng ứng với môn thể thao này
            int userRank = userCategoryRankRepository
                    .findByUser_UserIdAndCategory_CategoryId(currentUser.getUserId(), category.getCategoryId())
                    .map(UserCategoryRank::getRankPoint)
                    .orElse(0); // Nếu chưa từng chơi môn này, rank mặc định là 0

            if (match.getMinRank() != null && userRank < match.getMinRank()) {
                throw new RuntimeException("Điểm Rank môn này của bạn (" + userRank + ") không đủ để tham gia. Yêu cầu tối thiểu: " + match.getMinRank());
            }
            if (match.getMaxRank() != null && userRank > match.getMaxRank()) {
                throw new RuntimeException("Điểm Rank môn này của bạn (" + userRank + ") vượt quá mức cho phép. Tối đa: " + match.getMaxRank());
            }
        }

        boolean alreadyJoined = registrationRepository.existsByMatchAndUser(match, currentUser);
        if (alreadyJoined) {
            throw new RuntimeException("Bạn đã tham gia trận này rồi");
        }

        MatchRegistration reg = MatchRegistration.builder()
                .user(currentUser)
                .match(match)
                .registeredAt(LocalDateTime.now())
                .isDepositConfirmed(false)
                .build();
        registrationRepository.save(reg);

        match.setCurrentPlayers(match.getCurrentPlayers() + 1);

        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            match.setStatus(MatchStatus.WAITING_DEPOSIT);
        }

        matchRepository.save(match);
    }

    @Transactional
    @Override
    public void divideTeams(UUID matchId, DivideTeamRequest request) {
        User currentUser = userService.getCurrentUserEntity();
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        boolean isParticipant = registrationRepository.existsByMatchAndUser(match, currentUser);
        if (!isParticipant && !match.getHost().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Chỉ người tham gia mới được chọn đội!");
        }

        // Tùy logic của bạn: Có thể yêu cầu trận đấu phải FULL hoặc CONFIRMED mới được chia đội
        if (match.getStatus() == MatchStatus.OPEN) {
            throw new RuntimeException("Trận đấu chưa đủ người để chia đội!");
        }

        List<MatchRegistration> registrations = registrationRepository.findByMatch(match);

        // Gắn Team Number cho từng người chơi
        for (MatchRegistration reg : registrations) {
            UUID userId = reg.getUser().getUserId();

            if (request.getTeam1UserIds() != null && request.getTeam1UserIds().contains(userId)) {
                reg.setTeamNumber(1);
            } else if (request.getTeam2UserIds() != null && request.getTeam2UserIds().contains(userId)) {
                reg.setTeamNumber(2);
            }
        }

        registrationRepository.saveAll(registrations);
        log.info("Host {} đã chia đội cho trận đấu {}", currentUser.getUserName(), matchId);
    }

    @Transactional
    @Override
    public void confirmDeposit(UUID matchId) {
        User currentUser = userService.getCurrentUserEntity();
        Match match = matchRepository.findByIdWithLock(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        if (match.getStatus() != MatchStatus.WAITING_DEPOSIT) {
            throw new RuntimeException("Trận đấu chưa đủ người hoặc không ở trạng thái chờ xác nhận cọc!");
        }

        MatchRegistration reg = registrationRepository.findByMatchAndUser(match, currentUser)
                .orElseThrow(() -> new RuntimeException("Bạn chưa tham gia trận này!"));

        if (reg.getIsDepositConfirmed()) {
            throw new RuntimeException("Bạn đã xác nhận cọc rồi!");
        }

        BigDecimal totalPrice = calculateTotalCourtPrice(match);
        BigDecimal depositAmount = BigDecimal.ZERO;

        if (totalPrice.compareTo(BigDecimal.ZERO) > 0) {
            depositAmount = totalPrice.divide(BigDecimal.valueOf(match.getMaxPlayers()), 0, RoundingMode.HALF_UP);
        }

        if (depositAmount.compareTo(BigDecimal.ZERO) > 0) {
//            BigDecimal currentBalance = currentUser.getFakeMoney() != null ? currentUser.getFakeMoney() : BigDecimal.ZERO;
//            if (currentBalance.compareTo(depositAmount) < 0) {
//                throw new RuntimeException("Ví của bạn không đủ " + depositAmount + " VNĐ để đặt cọc! Vui lòng nạp thêm tiền.");
//            }

//            currentUser.setFakeMoney(currentBalance.subtract(depositAmount));
            userRepository.save(currentUser);

//            log.info("[TRANSACTION] - MINUS | Tác vụ: ĐẶT CỌC | User: {} ({}) | Số tiền: -{} VNĐ | Trận: {} | Số dư mới: {}",
//                    currentUser.getUserName(),
//                    currentUser.getUserId(),
//                    depositAmount,
//                    match.getMatchId(),
//                    currentUser.getFakeMoney());

            log.info("Đã trừ {} VNĐ tiền cọc của user {}", depositAmount, currentUser.getUserName());
        }

        reg.setIsDepositConfirmed(true);
        registrationRepository.save(reg);

        List<MatchRegistration> allRegs = registrationRepository.findByMatch(match);
        boolean isAllConfirmed = allRegs.stream().allMatch(MatchRegistration::getIsDepositConfirmed);

        if (isAllConfirmed) {
            match.setStatus(MatchStatus.CONFIRMED);
            matchRepository.save(match);
            log.info("Trận đấu {} đã được tất cả người chơi xác nhận cọc.", match.getMatchId());
        }
    }

    @Override
    public PageResponse<MatchResponse> getOpenMatches(
            int page,
            int size,
            String category,
            String keyword,
            LocalDateTime startDate,
            LocalDateTime endDate,
            MatchType matchType,
            String ward, String district, String city
    ) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        Specification<Match> spec = Specification.where(MatchSpecifications.fetchAllDetails())
                .and(MatchSpecifications.hasStatus(MatchStatus.OPEN))
                .and(MatchSpecifications.hasCategory(category))
                .and(MatchSpecifications.searchByCourtName(keyword))
                .and(MatchSpecifications.isWithinTimeRange(startDate, endDate))
                .and(MatchSpecifications.hasMatchType(matchType))
                .and(MatchSpecifications.hasCity(city))
                .and(MatchSpecifications.hasDistrict(district))
                .and(MatchSpecifications.hasWard(ward));

        Page<Match> matchPage = matchRepository.findAll(spec, pageable);

        return PageResponse.of(matchPage, matchMapper.toResponseList(matchPage.getContent()));
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
            String keyword, LocalDateTime start, LocalDateTime end, MatchType matchType) {

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        Specification<Match> spec = Specification.where(MatchSpecifications.fetchAllDetails())
                .and(MatchSpecifications.hasStatus(status))
                .and(MatchSpecifications.hasCategory(category))
                .and(MatchSpecifications.searchByCourtName(keyword))
                .and(MatchSpecifications.isWithinTimeRange(start, end))
                .and(MatchSpecifications.hasMatchType(matchType));

        Page<Match> matchPage = matchRepository.findAll(spec, pageable);

        return PageResponse.of(matchPage, matchMapper.toResponseList(matchPage.getContent()));
    }

    @Override
    public PageResponse<MatchResponse> getOwnerMatchesPaged(int page, int size) {
        User currentUser = userService.getCurrentUserEntity();
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        Page<Match> matchPage = matchRepository.findByOwnerSystem(currentUser, pageable);

        return PageResponse.<MatchResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(matchPage.getTotalPages())
                .totalElements(matchPage.getTotalElements())
                .data(matchMapper.toResponseList(matchPage.getContent()))
                .build();
    }

    @Override
    public PageResponse<MatchResponse> getMyMatches(int page, int size) {
        User currentUser = userService.getCurrentUserEntity();
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("startTime").descending());
        Page<Match> matchPage = matchRepository.findMatchesByParticipantOrHost(currentUser, pageable);

        return PageResponse.<MatchResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(matchPage.getTotalPages())
                .totalElements(matchPage.getTotalElements())
                .data(matchMapper.toResponseList(matchPage.getContent()))
                .build();
    }

    @Override
    public PageResponse<MatchResponse> getUserMatchHistory(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("startTime").descending());

        Specification<Match> spec = Specification.where(MatchSpecifications.fetchAllDetails())
                .and(MatchSpecifications.isParticipantOrHost(userId))
                .and(MatchSpecifications.hasStatus(MatchStatus.COMPLETED));

        Page<Match> matchPage = matchRepository.findAll(spec, pageable);

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
        if (config.getRecurringType() == null) return false;

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
                .matchType(config.getMatchType())
                .winnerPercent(config.getWinnerPercent())
                .minRank(config.getMinRank())
                .maxRank(config.getMaxRank())
                .build();
        matchRepository.save(newMatch);
    }

    private BigDecimal calculateTotalCourtPrice(Match match) {
        if (match.getCourt() == null) return BigDecimal.ZERO;

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
}