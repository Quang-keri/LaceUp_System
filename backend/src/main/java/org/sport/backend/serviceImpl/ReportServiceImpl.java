package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.dto.response.payment.PaymentResponse;
import org.sport.backend.dto.response.report.EndOfDayReportDTO;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.BookingServiceItem;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.Payment;
import org.sport.backend.repository.*;
import org.sport.backend.service.ReportService;
import org.sport.backend.service.UserService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;

    private final UserService userService;

    @Override
    public Map<String, Object> getFullDashboardStatsOwner(String range) {
        return generateDashboardStats(range, userService.getCurrentUserEntity().getUserId());
    }

    @Override
    public Map<String, Object> getFullDashboardStatsAdmin(String range) {
        return generateDashboardStats(range, null);
    }

    @Override
    public List<Map<String, Object>> getDynamicOverviewChartAdmin(int year, Integer month) {
        return buildOverviewChart(year, month, null);
    }

    @Override
    public List<Map<String, Object>> getDynamicOverviewChartOwner(int year, Integer month) {
        return buildOverviewChart(year, month, userService.getCurrentUserEntity().getUserId());
    }

    @Override
    public EndOfDayReportDTO getEndOfDayReport(LocalDate reportDate) {
        // Mặc định lấy ngày hôm nay nếu client không truyền date
        LocalDate date = (reportDate != null) ? reportDate : LocalDate.now();
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        // 1. Fetch Dữ liệu từ DB
        List<Booking> bookings = bookingRepository.findAllBookingsForReport(startOfDay, endOfDay);
        List<Match> matches = matchRepository.findAllMatchesForReport(startOfDay, endOfDay);
        List<Payment> payments = paymentRepository.findAllPaymentsForReport(startOfDay, endOfDay);
        List<BookingServiceItem> serviceItems = bookingServiceItemRepository.findAllServiceItemsForReport(startOfDay, endOfDay);

        // 2. Mapping sang DTO với đầy đủ thuộc tính
        List<BookingResponse> bookingDTOs = bookings.stream().map(b -> BookingResponse.builder()
                .bookingId(b.getBookingId())
                .bookingStatus(b.getBookingStatus())
                .totalPrice(b.getTotalPrice())
                .depositAmount(b.getDepositAmount())
                .remainingAmount(b.getRemainingAmount())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .build()).collect(Collectors.toList());

        List<MatchResponse> matchDTOs = matches.stream().map(m -> MatchResponse.builder()
                .matchId(m.getMatchId())
                .courtName(m.getCourt().getCourtName())
                .startTime(m.getStartTime())
                .endTime(m.getEndTime())
                .status(m.getStatus().toString())
                .matchType(m.getMatchType())
                .currentPlayers(m.getCurrentPlayers())
                .maxPlayers(m.getMaxPlayers())
                .winnerPercent(m.getWinnerPercent())
                .build()).collect(Collectors.toList());

        List<PaymentResponse> paymentDTOs = payments.stream().map(p -> PaymentResponse.builder()
                .paymentId(p.getPaymentId())
                .transactionDate(p.getTransactionDate())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .paymentStatus(p.getPaymentStatus())
                .paymentType(p.getPaymentType())
                .userId(p.getUser() != null ? p.getUser().getUserId() : null)
                .bookingId(p.getBooking() != null ? p.getBooking().getBookingId() : null)
                .channel(p.getChannel())
                .transactionCode(p.getTransactionCode())
                .orderCode(p.getOrderCode())
                .payosPaymentLinkId(p.getPayosPaymentLinkId())
                .build()).collect(Collectors.toList());

        List<BookingResponse.BookingServiceResponse> serviceItemDTOs = serviceItems.stream().map(s ->
                BookingResponse.BookingServiceResponse.builder()
                        .serviceId(s.getServiceItem() != null ? s.getServiceItem().getServiceItemId() : null)
                        .serviceName(s.getServiceItem() != null ? s.getServiceItem().getServiceName() : "N/A")
                        .quantity(s.getQuantity())
                        .price(s.getPrice())
                        .build()
        ).collect(Collectors.toList());

        // 3. Tính toán các con số tổng quan
        BigDecimal totalBookingRevenue = bookings.stream()
                .map(b -> b.getTotalPrice() != null ? b.getTotalPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalServiceRevenue = serviceItemDTOs.stream()
                .map(s -> {
                    if (s.getPrice() != null && s.getQuantity() != null) {
                        return s.getPrice().multiply(BigDecimal.valueOf(s.getQuantity()));
                    }
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = payments.stream()
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 4. Trả về DTO tổng hợp
        return EndOfDayReportDTO.builder()
                .reportDate(date)
                .totalBookingRevenue(totalBookingRevenue)
                .totalServiceRevenue(totalServiceRevenue)
                .totalPaid(totalPaid)
                .bookings(bookingDTOs)
                .matches(matchDTOs)
                .payments(paymentDTOs)
                .serviceItems(serviceItemDTOs)
                .build();
    }

    private List<Map<String, Object>> buildOverviewChart(int year, Integer month, UUID ownerId) {
        List<Map<String, Object>> chartData = new ArrayList<>();

        if (month == null) {
            for (int m = 1; m <= 12; m++) {
                LocalDateTime start = LocalDateTime.of(year, m, 1, 0, 0);
                LocalDateTime end = start.with(TemporalAdjusters.lastDayOfMonth()).with(LocalTime.MAX);
                chartData.add(createChartPoint("Tháng " + m, start, end, ownerId));
            }
        } else {
            int days = YearMonth.of(year, month).lengthOfMonth();
            for (int d = 1; d <= days; d++) {
                LocalDateTime start = LocalDateTime.of(year, month, d, 0, 0);
                LocalDateTime end = start.with(LocalTime.MAX);
                chartData.add(createChartPoint(d + "/" + month, start, end, ownerId));
            }
        }
        return chartData;
    }

    private Map<String, Object> createChartPoint(String timeLabel, LocalDateTime start, LocalDateTime end, UUID ownerId) {
        BigDecimal rev = paymentRepository.getTotalRevenue(start, end, ownerId);
        Long count = bookingRepository.countBookingsInRange(start, end, ownerId);
        Map<String, Object> point = new HashMap<>();
        point.put("time", timeLabel);
        point.put("revenue", rev != null ? rev : BigDecimal.ZERO);
        point.put("bookingCount", count != null ? count : 0L);
        return point;
    }

    private Map<String, Object> generateDashboardStats(String range, UUID ownerId) {
        LocalDateTime[] dates = calculateDateRange(range);

        Map<String, Object> fullDashboard = new HashMap<>();
        fullDashboard.put("bookingStats", getBookingStats(dates[0], dates[1], ownerId));
        fullDashboard.put("paymentStats", getPaymentStats(dates[0], dates[1], ownerId));
        fullDashboard.put("totalRevenue", paymentRepository.getTotalRevenue(dates[0], dates[1], ownerId) != null ? paymentRepository.getTotalRevenue(dates[0], dates[1], ownerId) : BigDecimal.ZERO);
        fullDashboard.put("topCourts", getTopCourts(dates[0], dates[1], ownerId));
        fullDashboard.put("newUsersCount", userRepository.countNewUsers(dates[0], dates[1]));
        fullDashboard.put("dailyStats7d", getDailyStatsLast7Days(ownerId));

        // Growth Stats
        LocalDateTime[] gDates = getGrowthDates();
        fullDashboard.put("revenueGrowth", calculateGrowth(
                paymentRepository.getTotalRevenue(gDates[0], gDates[1], ownerId),
                paymentRepository.getTotalRevenue(gDates[2], gDates[3], ownerId)));
        fullDashboard.put("newUserGrowth", calculateGrowth(
                BigDecimal.valueOf(userRepository.countNewUsers(gDates[0], gDates[1]) != null ? userRepository.countNewUsers(gDates[0], gDates[1]) : 0),
                BigDecimal.valueOf(userRepository.countNewUsers(gDates[2], gDates[3]) != null ? userRepository.countNewUsers(gDates[2], gDates[3]) : 0)));
        fullDashboard.put("cancellationRateGrowth", calculateGrowth(
                BigDecimal.valueOf(getCancelRate(gDates[0], gDates[1], ownerId)),
                BigDecimal.valueOf(getCancelRate(gDates[2], gDates[3], ownerId))));

        return fullDashboard;
    }

    // RÚT GỌN: Hàm dùng chung để tính thời gian cho Growth
    private LocalDateTime[] getGrowthDates() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startThis = now.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
        LocalDateTime startLast = startThis.minusMonths(1);
        LocalDateTime endLast = startThis.minusSeconds(1);
        return new LocalDateTime[]{startThis, now, startLast, endLast};
    }

    // RÚT GỌN: Hàm tính phần trăm tăng trưởng chung
    private Double calculateGrowth(BigDecimal current, BigDecimal previous) {
        if (current == null) current = BigDecimal.ZERO;
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(previous).divide(previous, 4, RoundingMode.HALF_UP).doubleValue() * 100;
    }

    private Double getCancelRate(LocalDateTime start, LocalDateTime end, UUID ownerId) {
        Map<BookingStatus, Long> stats = getBookingStats(start, end, ownerId);
        long cancelled = stats.getOrDefault(BookingStatus.CANCELLED, 0L);
        long total = stats.values().stream().mapToLong(Long::longValue).sum();
        return total == 0 ? 0.0 : (double) cancelled / total * 100.0;
    }

    private List<Map<String, Object>> getDailyStatsLast7Days(UUID ownerId) {
        List<Map<String, Object>> last7Days = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime start = LocalDateTime.now().minusDays(i).toLocalDate().atStartOfDay();
            Map<String, Object> p = createChartPoint(start.getDayOfMonth() + "/" + start.getMonthValue(), start, start.with(LocalTime.MAX), ownerId);
            p.put("date", p.remove("time")); // Đổi tên key cho khớp UI cũ
            last7Days.add(p);
        }
        return last7Days;
    }

    private List<Map<String, Object>> getTopCourts(LocalDateTime start, LocalDateTime end, UUID ownerId) {
        return bookingRepository.findTopCourtsByBookingCount(start, end, ownerId, PageRequest.of(0, 2))
                .stream().map(res -> Map.of("courtName", res[0], "bookingCount", res[1]))
                .collect(Collectors.toList());
    }

    private Map<BookingStatus, Long> getBookingStats(LocalDateTime start, LocalDateTime end, UUID ownerId) {
        Map<BookingStatus, Long> actual = bookingRepository.countAllByStatus(start, end, ownerId).stream()
                .collect(Collectors.toMap(res -> (BookingStatus) res[0], res -> (Long) res[1]));
        return Arrays.stream(BookingStatus.values()).collect(Collectors.toMap(s -> s, s -> actual.getOrDefault(s, 0L)));
    }

    private Map<PaymentStatus, Long> getPaymentStats(LocalDateTime start, LocalDateTime end, UUID ownerId) {
        Map<PaymentStatus, Long> actual = paymentRepository.countByPaymentStatus(start, end, ownerId).stream()
                .collect(Collectors.toMap(res -> (PaymentStatus) res[0], res -> (Long) res[1]));
        return Arrays.stream(PaymentStatus.values()).collect(Collectors.toMap(s -> s, s -> actual.getOrDefault(s, 0L)));
    }

    private LocalDateTime[] calculateDateRange(String range) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime startDate = switch (range) {
            case "today" -> startOfToday;
            case "yesterday" -> startOfToday.minusDays(1);
            case "this_week" -> now.with(java.time.DayOfWeek.MONDAY).toLocalDate().atStartOfDay();
            case "7d" -> now.minusDays(7);
            case "this_month" -> now.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
            case "30d" -> now.minusDays(30);
            case "last_month" ->
                    now.minusMonths(1).with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
            case "this_year" -> now.with(TemporalAdjusters.firstDayOfYear()).toLocalDate().atStartOfDay();
            case "last_year" -> now.minusYears(1).with(TemporalAdjusters.firstDayOfYear()).toLocalDate().atStartOfDay();
            case "1y" -> now.minusYears(1);
            default -> LocalDateTime.of(2020, 1, 1, 0, 0);
        };

        LocalDateTime endDate = switch (range) {
            case "yesterday" -> startOfToday.minusSeconds(1);
            case "last_month" ->
                    now.minusMonths(1).with(TemporalAdjusters.lastDayOfMonth()).toLocalDate().atTime(23, 59, 59);
            case "last_year" ->
                    now.minusYears(1).with(TemporalAdjusters.lastDayOfYear()).toLocalDate().atTime(23, 59, 59);
            default -> now;
        };
        return new LocalDateTime[]{startDate, endDate};
    }

}