package org.sport.backend.serviceImpl;

import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.*;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.chat.DivideTeamRequest;
import org.sport.backend.dto.request.match.AutoMatchRequest;
import org.sport.backend.dto.request.match.MatchRequest;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.dto.response.payment.CheckoutResponse;
import org.sport.backend.entity.*;
import org.sport.backend.mapper.MatchMapper;
import org.sport.backend.repository.*;
import org.sport.backend.service.CourtPriceService;
import org.sport.backend.service.MatchService;
import org.sport.backend.service.PaymentService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.MatchSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchServiceImpl implements MatchService {

    private final MatchRepository matchRepository;
    private final MatchRegistrationRepository registrationRepository;
    private final CourtRepository courtRepository;
    private final CategoryRepository categoryRepository;
    private final UserCategoryRankRepository userCategoryRankRepository;
    private final SlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ReputationLogRepository reputationLogRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    private final MatchMapper matchMapper;

    private final UserService userService;
    private final CourtPriceService courtPriceService;
    private final PaymentService paymentService;

    @Override
    @Transactional
    public MatchResponse createMatch(MatchRequest request) {
        User currentUser = userService.getCurrentUserEntity();

        if (request.getMatchType() == MatchType.RANKED) {
            if (request.getMinRank() == null || request.getMaxRank() == null) {
                throw new RuntimeException("Vui lòng nhập mức Rank tối thiểu và tối đa cho trận Rank");
            }
        }

        MatchType type = request.getMatchType() != null ? request.getMatchType() : MatchType.NORMAL;
        if (currentUser.getCreditScore() < 60 && (type == MatchType.RANKED || type == MatchType.BET)) {
            throw new RuntimeException("Điểm uy tín của bạn (" + currentUser.getCreditScore() + ") dưới 60. Bạn chỉ có thể tạo trận thường (NORMAL)!");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new RuntimeException("Thời gian bắt đầu và kết thúc không hợp lệ. Trận đấu không được qua đêm.");
        }

        Match.MatchBuilder<?, ?> matchBuilder = Match.builder()
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxPlayers(request.getMaxPlayers())
                .minPlayersToStart(request.getMinPlayersToStart())
                .currentPlayers(0)
                .status(MatchStatus.OPEN)
                .host(currentUser)
                .isRecurring(request.isRecurring())
                .recurringType(request.getRecurringType())
                .dayOfWeek(request.getDayOfWeek())
                .endDate(request.getEndDate())
                .matchType(type)
                .minRank(request.getMinRank())
                .maxRank(request.getMaxRank())
                .roomCode(generateUniqueRoomCode())
                .note(request.getNote());

        if (request.getCourtId() != null) {
            Court court = courtRepository.findById(request.getCourtId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sân này"));

            RentalArea area = court.getRentalArea();

            if (area != null && area.getOpenTime() != null && area.getCloseTime() != null) {
                LocalTime requestedStartTime = request.getStartTime().toLocalTime();
                LocalTime requestedEndTime = request.getEndTime().toLocalTime();

                if (requestedStartTime.isBefore(area.getOpenTime()) || requestedEndTime.isAfter(area.getCloseTime())) {
                    throw new RuntimeException(String.format("Khung giờ không hợp lệ. Khu vực này chỉ hoạt động từ %s đến %s",
                            area.getOpenTime(), area.getCloseTime()));
                }
            }

            boolean isMatchConflict = matchRepository.existsConflictMatch(
                    court.getCourtId(), request.getStartTime(), request.getEndTime(), null);
            if (isMatchConflict) {
                throw new RuntimeException("Đã có trận đấu khác (Match) được tổ chức tại sân này trong khung giờ bạn chọn!");
            }

            boolean isBookingConflict = slotRepository.existsConflictSlotForCourt(
                    court.getCourtId(), request.getStartTime(), request.getEndTime());
            if (isBookingConflict) {
                throw new RuntimeException("Sân này đã được khách đặt (Booking) trong khung giờ bạn chọn!");
            }

            matchBuilder.court(court);
            assert area != null;
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

        if (savedMatch.getCourt() != null) {
            Court court = savedMatch.getCourt();
            CourtCopy availableCourtCopy = null;

            for (CourtCopy copy : court.getCourtCopies()) {
                List<Slot> conflicts = slotRepository.findConflictSlot(
                        copy.getCourtCopyId(),
                        savedMatch.getStartTime(),
                        savedMatch.getEndTime()
                );

                if (conflicts == null || conflicts.isEmpty()) {
                    availableCourtCopy = copy;
                    break;
                }
            }

            if (availableCourtCopy == null) {
                throw new RuntimeException("Hệ thống lỗi: Không tìm thấy sân con (CourtCopy) trống dù đã check tổng tổng thể.");
            }

            BigDecimal matchPrice = courtPriceService.calculatePrice(
                    availableCourtCopy,
                    savedMatch.getStartTime(),
                    savedMatch.getEndTime()
            );

            Slot matchSlot = Slot.builder()
                    .startTime(savedMatch.getStartTime())
                    .endTime(savedMatch.getEndTime())
                    .slotStatus(SlotStatus.MATCH_PENDING)
                    .courtCopy(availableCourtCopy)
                    .match(savedMatch)
                    .price(matchPrice)
                    .build();

            slotRepository.save(matchSlot);
        }

        if (currentUser.getRole().getRoleName().equals("RENTER")) {
            int initialPlayers = (request.getPlayerCount() != null && request.getPlayerCount() > 0)
                    ? request.getPlayerCount()
                    : 1;

            joinMatch(savedMatch.getMatchId(), initialPlayers);
        }

        return matchMapper.toResponse(savedMatch);
    }

    @Transactional
    @Override
    public CheckoutResponse joinMatch(UUID matchId, Integer playerCount) {
        if (playerCount == null || playerCount < 1) {
            playerCount = 1;
        }

        User currentUser = userService.getCurrentUserEntity();
        Match match = matchRepository.findByIdWithLock(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        if (currentUser.getCreditScore() < 60
                && (match.getMatchType() == MatchType.RANKED
                || match.getMatchType() == MatchType.BET)) {
            throw new RuntimeException("Điểm uy tín của bạn (" + currentUser.getCreditScore() + ") dưới 60. Bạn chỉ có thể tham gia trận thường (NORMAL)!");
        }

        if (match.getStatus() == MatchStatus.READY ||
                match.getStatus() == MatchStatus.COMPLETED ||
                match.getStatus() == MatchStatus.CANCELLED) {
            throw new RuntimeException("Trận đấu đã đóng, đã đủ người hoặc không còn khả dụng!");
        }

        if (match.getCurrentPlayers() + playerCount > match.getMaxPlayers()) {
            throw new RuntimeException("Trận đấu không đủ chỗ trống. Chỉ còn " +
                    (match.getMaxPlayers() - match.getCurrentPlayers()) + " slot.");
        }

        if (match.getMatchType() == MatchType.RANKED) {
            Category category = match.getCategory();
            if (category == null) {
                throw new RuntimeException("Trận đấu không xác định được môn thể thao để xét Rank.");
            }

            int userRank = userCategoryRankRepository
                    .findByUser_UserIdAndCategory_CategoryId(currentUser.getUserId(), category.getCategoryId())
                    .map(UserCategoryRank::getRankPoint)
                    .orElse(0);

            if (match.getMinRank() != null && userRank < match.getMinRank()) {
                throw new RuntimeException("Điểm Rank môn này của bạn (" + userRank + ") không đủ để tham gia. Yêu cầu tối thiểu: " + match.getMinRank());
            }
            if (match.getMaxRank() != null && userRank > match.getMaxRank()) {
                throw new RuntimeException("Điểm Rank môn này của bạn (" + userRank + ") vượt quá mức cho phép. Tối đa: " + match.getMaxRank());
            }
        }

        // --- Tính toán chi phí trước khi xử lý đăng ký ---
        List<Slot> matchSlots = slotRepository.findByMatch(match);
        BigDecimal totalMatchPrice = BigDecimal.ZERO;
        if (matchSlots != null) {
            totalMatchPrice = matchSlots.stream()
                    .map(Slot::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        BigDecimal unitPrice = totalMatchPrice.divide(BigDecimal.valueOf(
                        match.getMaxPlayers()),
                2,
                RoundingMode.HALF_UP);
        BigDecimal amountDue = unitPrice.multiply(BigDecimal.valueOf(playerCount));

        Optional<MatchRegistration> existingReg = registrationRepository.findByMatchAndUser(match, currentUser);

        MatchRegistration reg;
        if (existingReg.isPresent()) {
            reg = existingReg.get();

            if (reg.getIsCancelled() == null || !reg.getIsCancelled()) {
                throw new RuntimeException("Bạn đã tham gia trận này rồi");
            }

            reg.setIsCancelled(false);
            reg.setPlayerCount(playerCount);
            reg.setAmountDue(amountDue);
            reg.setIsPaid(false);
            reg.setRegisteredAt(LocalDateTime.now());
            reg.setTeamNumber(null);
        } else {
            reg = MatchRegistration.builder()
                    .user(currentUser)
                    .match(match)
                    .playerCount(playerCount)
                    .amountDue(amountDue)
                    .isPaid(false)
                    .registeredAt(LocalDateTime.now())
                    .build();
        }
        registrationRepository.save(reg);

        match.setCurrentPlayers(match.getCurrentPlayers() + playerCount);

        if (match.getCurrentPlayers().equals(match.getMaxPlayers())) {
            match.setStatus(MatchStatus.READY);

            assert matchSlots != null;
            for (Slot slot : matchSlots) {
                slot.setSlotStatus(SlotStatus.MATCH_FULL);
            }

            Booking matchBooking = Booking.builder()
                    .renter(match.getHost())
                    .rentalArea(match.getCourt().getRentalArea())
                    .totalPrice(totalMatchPrice)
                    .remainingAmount(totalMatchPrice)
                    .bookingStatus(BookingStatus.BOOKED)
                    .startTime(match.getStartTime())
                    .endTime(match.getEndTime())
                    .bookingType(BookingType.MATCH)
                    .build();

            matchBooking = bookingRepository.save(matchBooking);

            match.setBooking(matchBooking);

            for (Slot slot : matchSlots) {
                slot.setBooking(matchBooking);
            }

            slotRepository.saveAll(matchSlots);
        }

        matchRepository.save(match);

        return paymentService.checkoutMatchJoin(reg.getRegistrationId(), PaymentMethod.VN_PAY);
    }

    @Transactional
    @Override
    public void joinByRoomCode(String roomCode, Integer playerCount) {
        Match match = matchRepository.findByRoomCode(roomCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Mã phòng không tồn tại hoặc không hợp lệ!"));

        joinMatch(match.getMatchId(), playerCount);
    }

    @Transactional
    @Override
    public MatchResponse autoMatch(AutoMatchRequest request) {
        User currentUser = userService.getCurrentUserEntity();

        Integer userRankPoint = null;
        if (request.getMatchType() == MatchType.RANKED) {
            userRankPoint = userCategoryRankRepository
                    .findByUser_UserIdAndCategory_CategoryId(
                            currentUser.getUserId(),
                            request.getCategoryId())
                    .map(UserCategoryRank::getRankPoint)
                    .orElse(0);
        }

        Specification<Match> spec = Specification.where(MatchSpecifications.hasStatus(MatchStatus.OPEN))
                .and(MatchSpecifications.hasMatchType(request.getMatchType()))
                .and(MatchSpecifications.hasCity(request.getCity()))
                .and(MatchSpecifications.isNotParticipant(currentUser.getUserId()))
                .and((root, query, cb)
                        -> cb.equal(root.join("category").get("categoryId"), request.getCategoryId()))
                .and((root, query, cb)
                        -> cb.lessThan(root.get("currentPlayers"), root.get("maxPlayers")));

        if (userRankPoint != null) {
            final int rankToCompare = userRankPoint;
            spec = spec.and((root, query, cb) -> {
                Predicate minRankNull = cb.isNull(root.get("minRank"));
                Predicate minRankCheck = cb.lessThanOrEqualTo(root.get("minRank"), rankToCompare);

                Predicate maxRankNull = cb.isNull(root.get("maxRank"));
                Predicate maxRankCheck = cb.greaterThanOrEqualTo(root.get("maxRank"), rankToCompare);

                return cb.and(cb.or(minRankNull, minRankCheck), cb.or(maxRankNull, maxRankCheck));
            });
        }

        Pageable pageable = PageRequest.of(0, 1, Sort.by("createdAt").ascending());
        Page<Match> candidateMatches = matchRepository.findAll(spec, pageable);

        if (candidateMatches.isEmpty()) {
            throw new RuntimeException("Hiện tại chưa tìm thấy trận đấu nào phù hợp với yêu cầu của bạn. Vui lòng thử lại sau hoặc tự tạo phòng!");
        }

        Match selectedMatch = candidateMatches.getContent().getFirst();
        joinMatch(selectedMatch.getMatchId(), 1);

        return matchMapper.toResponse(selectedMatch);
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

        if (match.getStatus() == MatchStatus.OPEN) {
            throw new RuntimeException("Trận đấu chưa đủ người để chia đội!");
        }

        List<MatchRegistration> registrations = registrationRepository.findByMatch(match);

        int maxTeamSize = (match.getMaxPlayers() + 1) / 2;
        int team1Size = 0;
        int team2Size = 0;

        for (MatchRegistration reg : registrations) {
            UUID userId = reg.getUser().getUserId();

            int count = reg.getPlayerCount() != null ? reg.getPlayerCount() : 1;

            if (request.getTeam1UserIds() != null && request.getTeam1UserIds().contains(userId)) {
                reg.setTeamNumber(1);
                team1Size += count;
            } else if (request.getTeam2UserIds() != null && request.getTeam2UserIds().contains(userId)) {
                reg.setTeamNumber(2);
                team2Size += count;
            } else {
                reg.setTeamNumber(null);
            }
        }

        if (team1Size > maxTeamSize) {
            throw new RuntimeException("Đội 1 đã vượt quá số lượng cho phép! (Tối đa " + maxTeamSize + " slot)");
        }
        if (team2Size > maxTeamSize) {
            throw new RuntimeException("Đội 2 đã vượt quá số lượng cho phép! (Tối đa " + maxTeamSize + " slot)");
        }

        registrationRepository.saveAll(registrations);
        log.info("Host {} đã chia đội cho trận đấu {}. Đội 1: {} người, Đội 2: {} người",
                currentUser.getUserName(), matchId, team1Size, team2Size);
    }

    @Override
    public PageResponse<MatchResponse> getOpenMatches(
            int page, int size, String category, String keyword,
            LocalDateTime startDate, LocalDateTime endDate, MatchType matchType,
            String ward, String city
    ) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("startTime").ascending());

        Specification<Match> spec = Specification.where(MatchSpecifications.fetchAllDetails())
                .and(MatchSpecifications.hasStatus(MatchStatus.OPEN))
                .and(MatchSpecifications.hasCategory(category))
                .and(MatchSpecifications.searchByCourtName(keyword))
                .and(MatchSpecifications.isWithinTimeRange(startDate, endDate))
                .and(MatchSpecifications.fromTodayOnwards())
                .and(MatchSpecifications.hasMatchType(matchType))
                .and(MatchSpecifications.hasCity(city))
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
    public PageResponse<MatchResponse> getOwnerMatchesPaged(
            int page, int size, MatchStatus status, String category,
            String keyword, LocalDateTime startDate, LocalDateTime endDate) {

        User currentUser = userService.getCurrentUserEntity();
        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by("createdAt").descending());

        Specification<Match> spec = Specification.where(MatchSpecifications.fetchAllDetails())
                .and(MatchSpecifications.isOwnerSystem(currentUser.getUserId()))
                .and(MatchSpecifications.hasStatus(status))
                .and(MatchSpecifications.hasCategory(category))
                .and(MatchSpecifications.searchByCourtName(keyword))
                .and(MatchSpecifications.isWithinTimeRange(startDate, endDate));

        Page<Match> matchPage = matchRepository.findAll(spec, pageable);

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
        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by("startTime").descending()
        );
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
    public PageResponse<MatchResponse> getUserMatchHistory(
            UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by("startTime").descending());

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
    @Override
    public void generateNextMatches() {
        List<Match> recurringConfigs = matchRepository.findByIsRecurringTrue();

        for (Match config : recurringConfigs) {
            for (int i = 1; i <= 7; i++) {
                LocalDate targetDate = LocalDate.now().plusDays(i);

                if (shouldCreateForDate(config, targetDate)) {
                    LocalTime configStartTime = config.getStartTime().toLocalTime();
                    LocalTime configEndTime = config.getEndTime().toLocalTime();

                    LocalDateTime targetStart = targetDate.atTime(configStartTime);
                    LocalDateTime targetEnd = targetDate.atTime(configEndTime);

                    if (!targetStart.isBefore(targetEnd)) {
                        log.warn("Bỏ qua tạo Match tự động định kỳ cho sân [{}] do thời gian không hợp lệ (nghi ngờ qua đêm).",
                                config.getCourt().getCourtId());
                        continue;
                    }

                    RentalArea area = config.getCourt().getRentalArea();
                    if (area != null && area.getOpenTime() != null && area.getCloseTime() != null) {
                        if (configStartTime.isBefore(area.getOpenTime())
                                || configEndTime.isAfter(area.getCloseTime())) {
                            log.warn("Bỏ qua tạo Match tự động định kỳ cho sân [{}] do nằm ngoài giờ hoạt động (Mở: {}, Đóng: {}).",
                                    config.getCourt().getCourtId(), area.getOpenTime(), area.getCloseTime());
                            continue;
                        }
                    }

                    boolean isMatchConflict = matchRepository.existsConflictMatch(
                            config.getCourt().getCourtId(),
                            targetStart,
                            targetEnd,
                            null
                    );

                    boolean isBookingConflict = slotRepository.existsConflictSlotForCourt(
                            config.getCourt().getCourtId(),
                            targetStart,
                            targetEnd
                    );

                    if (!isMatchConflict && !isBookingConflict) {
                        createNewMatchInstance(config, targetDate);
                    } else {
                        log.info("Bỏ qua tạo Match tự động định kỳ cho sân [{}] vào lúc [{}] vì đã có lịch (Match hoặc Booking) bị trùng.",
                                config.getCourt().getCourtId(), targetStart);
                    }
                }
            }
        }
    }

    @Transactional
    @Override
    public void leaveMatch(UUID matchId) {
        User currentUser = userService.getCurrentUserEntity();
        Match match = matchRepository.findByIdWithLock(matchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy trận đấu"));

        MatchRegistration reg = registrationRepository.findActiveByMatchAndUser(match, currentUser)
                .orElseThrow(() -> new RuntimeException("Bạn chưa tham gia hoặc đã rời trận đấu này!"));

        if (match.getStatus() == MatchStatus.COMPLETED
                || match.getStatus() == MatchStatus.CANCELLED) {
            throw new RuntimeException("Không thể rời trận đấu đã kết thúc hoặc đã hủy.");
        }

        boolean isLateCancel = false;
        if (match.getStartTime() != null) {
            LocalDateTime cancelThreshold = match.getStartTime().minusHours(24);
            if (!LocalDateTime.now().isBefore(cancelThreshold)) {
                isLateCancel = true;
            }
        }

        if (isLateCancel) {
            int currentScore = currentUser.getCreditScore() != null ? currentUser.getCreditScore() : 100;
            currentUser.setCreditScore(Math.max(0, currentScore - 10));
            userRepository.save(currentUser);

            ReputationLog repLog = ReputationLog.builder()
                    .user(currentUser)
                    .pointsChanged(-10)
                    .reason("Rút lui khỏi trận ghép quá sát giờ thi đấu (dưới 24h)")
                    .build();
            reputationLogRepository.save(repLog);
        }

        List<Payment> relatedPayments = paymentRepository.findAllByMatchRegistration(reg);
        for (Payment payment : relatedPayments) {
            if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
                payment.setPaymentStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }
        }

        reg.setIsCancelled(true);
        reg.setTeamNumber(null);
        registrationRepository.save(reg);

        int newPlayerCount = match.getCurrentPlayers() - reg.getPlayerCount();
        match.setCurrentPlayers(Math.max(0, newPlayerCount));

        if (match.getCurrentPlayers() == 0) {
            match.setStatus(MatchStatus.CANCELLED);

            if (match.getBooking() != null) {
                Booking booking = match.getBooking();
                booking.setBookingStatus(BookingStatus.CANCELLED);
                bookingRepository.save(booking);
                match.setBooking(null);
            }

            List<Slot> matchSlots = slotRepository.findByMatch(match);
            if (matchSlots != null && !matchSlots.isEmpty()) {
                for (Slot slot : matchSlots) {
                    slot.setSlotStatus(SlotStatus.CANCELLED);
                    slot.setBooking(null);
                }
                slotRepository.saveAll(matchSlots);
            }

        } else if (match.getStatus() == MatchStatus.READY
                && match.getCurrentPlayers() < match.getMaxPlayers()) {

            match.setStatus(MatchStatus.OPEN);

            List<Slot> matchSlots = slotRepository.findByMatch(match);
            if (matchSlots != null && !matchSlots.isEmpty()) {
                for (Slot slot : matchSlots) {
                    slot.setSlotStatus(SlotStatus.MATCH_PENDING);
                    slot.setBooking(null);
                }
                slotRepository.saveAll(matchSlots);
            }

            if (match.getBooking() != null) {
                Booking tempBooking = match.getBooking();
                match.setBooking(null);

                bookingRepository.delete(tempBooking);
            }
        }

        matchRepository.save(match);
        log.info("User {} đã tự rút khỏi trận {}. Trạng thái trận đấu hiện tại: {}. Tiền vé không được hoàn lại.",
                currentUser.getUserId(), matchId, match.getStatus());
    }

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void autoCancelInvalidMatches() {
        LocalDateTime checkThreshold = LocalDateTime.now().plusMinutes(30);

        List<MatchStatus> pendingStatuses = List.of(MatchStatus.OPEN);
        List<Match> matchesToCheck =
                matchRepository.findMatchesToAutoCancel(pendingStatuses, checkThreshold);

        if (matchesToCheck.isEmpty()) {
            return;
        }

        for (Match match : matchesToCheck) {
            boolean shouldCancel = false;
            String cancelReason = "";

            if (match.getStatus() == MatchStatus.OPEN) {
                int minPlayers = (match.getMinPlayersToStart() != null) ? match.getMinPlayersToStart() : 2;
                if (match.getCurrentPlayers() < minPlayers) {
                    shouldCancel = true;
                    cancelReason = "Không đủ số lượng người chơi tối thiểu (" + match.getCurrentPlayers() + "/" + minPlayers + ") trước giờ thi đấu.";
                }
            }

            if (match.getStartTime().isBefore(LocalDateTime.now())) {
                shouldCancel = true;
                cancelReason = "Trận đấu đã quá hạn thời gian bắt đầu nhưng chưa đủ điều kiện khởi tranh.";
            }

            if (shouldCancel) {
                executeCancelMatch(match, cancelReason);
            }
        }
    }

    private void executeCancelMatch(Match match, String reason) {
        log.info("Auto-Canceling Match [{}] - Lực lượng: {}/{} - Lý do: {}",
                match.getMatchId(), match.getCurrentPlayers(), match.getMaxPlayers(), reason);

        match.setStatus(MatchStatus.EXPIRED);
        matchRepository.save(match);

        List<Slot> matchSlots = slotRepository.findByMatch(match);
        if (matchSlots != null && !matchSlots.isEmpty()) {
            for (Slot slot : matchSlots) {
                slot.setSlotStatus(SlotStatus.CANCELLED);
            }
            slotRepository.saveAll(matchSlots);
            log.info("Đã giải phóng {} slot(s) của trận [{}]", matchSlots.size(), match.getMatchId());
        }

        List<Payment> successfulPayments =
                paymentRepository.findSuccessfulPaymentsByMatch(match.getMatchId());
        if (!successfulPayments.isEmpty()) {
            for (Payment payment : successfulPayments) {
                payment.setPaymentStatus(PaymentStatus.REFUND_PENDING);

                transactionRepository.findByReferenceId(payment.getPaymentId().toString())
                        .ifPresent(tx -> {
                            tx.setStatus(TransactionStatus.FAILED);
                            transactionRepository.save(tx);
                        });
            }
            paymentRepository.saveAll(successfulPayments);
            log.info("Đã đưa {} giao dịch của trận Auto-Cancel [{}] vào danh sách Chờ Hoàn Tiền.",
                    successfulPayments.size(), match.getMatchId());
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
            return config.getDayOfWeek() == date.getDayOfWeek();
        }
        return false;
    }

    private void createNewMatchInstance(Match config, LocalDate date) {
        LocalDateTime targetStart = date.atTime(config.getStartTime().toLocalTime());
        LocalDateTime targetEnd = date.atTime(config.getEndTime().toLocalTime());

        Match newMatch = Match.builder()
                .host(config.getHost())
                .court(config.getCourt())
                .category(config.getCategory())
                .startTime(targetStart)
                .endTime(targetEnd)
                .status(MatchStatus.OPEN)
                .currentPlayers(0)
                .maxPlayers(config.getMaxPlayers())
                .isRecurring(false)
                .matchType(config.getMatchType())
                .minRank(config.getMinRank())
                .maxRank(config.getMaxRank())
                .build();

        Match savedMatch = matchRepository.save(newMatch);

        if (savedMatch.getCourt() != null) {
            Court court = savedMatch.getCourt();
            CourtCopy availableCourtCopy = null;

            for (CourtCopy copy : court.getCourtCopies()) {
                List<Slot> conflicts = slotRepository.findConflictSlot(
                        copy.getCourtCopyId(),
                        savedMatch.getStartTime(),
                        savedMatch.getEndTime()
                );

                if (conflicts == null || conflicts.isEmpty()) {
                    availableCourtCopy = copy;
                    break;
                }
            }

            if (availableCourtCopy != null) {
                BigDecimal matchPrice = courtPriceService.calculatePrice(
                        availableCourtCopy,
                        savedMatch.getStartTime(),
                        savedMatch.getEndTime()
                );

                Slot matchSlot = Slot.builder()
                        .startTime(savedMatch.getStartTime())
                        .endTime(savedMatch.getEndTime())
                        .slotStatus(SlotStatus.BOOKED)
                        .courtCopy(availableCourtCopy)
                        .match(savedMatch)
                        .price(matchPrice)
                        .build();

                slotRepository.save(matchSlot);
            } else {
                log.error("Hệ thống lỗi: Không tìm thấy sân con (CourtCopy) trống để gán cho Match tự động ID [{}]", savedMatch.getMatchId());
            }
        }
    }

    private String generateUniqueRoomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();
        java.util.Random rnd = new java.util.Random();
        String roomCode;
        do {
            code.setLength(0);
            for (int i = 0; i < 6; i++) {
                code.append(chars.charAt((int) (rnd.nextFloat() * chars.length())));
            }
            roomCode = code.toString();
        } while (matchRepository.existsByRoomCode(roomCode));
        return roomCode;
    }
}