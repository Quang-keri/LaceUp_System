package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.constant.SlotStatus;
import org.sport.backend.entity.User;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.repository.PaymentRepository;
import org.sport.backend.repository.SlotRepository;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.ReportService;
import org.sport.backend.service.UserService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final SlotRepository slotRepository;

    private final UserService userService;

    @Override
    public Map<String, Object> getFullDashboardStatsOwner(String range) {
        User user = userService.getCurrentUserEntity();
        return generateDashboardStats(range, user.getUserId());
    }

    @Override
    public Map<String, Object> getFullDashboardStatsAdmin(String range) {
        return generateDashboardStats(range, null);
    }

    private Map<String, Object> generateDashboardStats(String range, UUID ownerId) {
        LocalDateTime[] dates = calculateDateRange(range);
        LocalDateTime startDate = dates[0];
        LocalDateTime endDate = dates[1];

        Map<String, Object> fullDashboard = new HashMap<>();
        fullDashboard.put("bookingStats", getBookingStats(startDate, endDate, ownerId));
        fullDashboard.put("paymentStats", getPaymentStats(startDate, endDate, ownerId));
        fullDashboard.put("totalRevenue", getTotalRevenue(startDate, endDate, ownerId));
        fullDashboard.put("monthlyRevenue", getMonthlyRevenue(ownerId));
        fullDashboard.put("topCourts", getTopCourts(startDate, endDate, ownerId));
        fullDashboard.put("newUsersCount", userRepository.countNewUsers(startDate, endDate));
        fullDashboard.put("dailyRevenue7d", getDailyRevenueLast7Days(ownerId));
        fullDashboard.put("peakHour", getPeakBookingHour(startDate, endDate, ownerId));
        fullDashboard.put("occupancyRate", calculateOccupancyRate(startDate, endDate, ownerId));
        fullDashboard.put("revenueGrowth", calculateRevenueGrowthPercentage(ownerId));

        return fullDashboard;
    }

    private List<Map<String, Object>> getMonthlyRevenue(UUID ownerId) {
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        int currentYear = LocalDateTime.now().getYear();

        for (int month = 1; month <= 12; month++) {
            LocalDateTime startOfMonth = LocalDateTime.of(currentYear, month, 1, 0, 0);
            LocalDateTime endOfMonth = startOfMonth.with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59);

            BigDecimal revenue = paymentRepository.getTotalRevenue(startOfMonth, endOfMonth, ownerId);

            Map<String, Object> dataPoint = new HashMap<>();
            dataPoint.put("month", "Tháng " + month);
            dataPoint.put("revenue", revenue != null ? revenue : BigDecimal.ZERO);
            monthlyData.add(dataPoint);
        }
        return monthlyData;
    }

    private LocalDateTime[] calculateDateRange(String range) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate;
        LocalDateTime endDate = now;

        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfToday = now.toLocalDate().atTime(23, 59, 59);

        switch (range) {
            case "today" -> {
                startDate = startOfToday;
                endDate = endOfToday;
            }
            case "yesterday" -> {
                startDate = startOfToday.minusDays(1);
                endDate = startOfToday.minusSeconds(1);
            }
            case "this_week" -> startDate = now.with(java.time.DayOfWeek.MONDAY).toLocalDate().atStartOfDay();
            case "7d" -> startDate = now.minusDays(7);
            case "this_month" -> startDate = now.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
            case "30d" -> startDate = now.minusDays(30);
            case "last_month" -> {
                startDate = now.minusMonths(1).with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
                endDate = now.minusMonths(1).with(TemporalAdjusters.lastDayOfMonth()).toLocalDate().atTime(23, 59, 59);
            }
            case "this_year" -> startDate = now.with(TemporalAdjusters.firstDayOfYear()).toLocalDate().atStartOfDay();
            case "last_year" -> {
                startDate = now.minusYears(1).with(TemporalAdjusters.firstDayOfYear()).toLocalDate().atStartOfDay();
                endDate = now.minusYears(1).with(TemporalAdjusters.lastDayOfYear()).toLocalDate().atTime(23, 59, 59);
            }
            case "1y" -> startDate = now.minusYears(1);
            default -> startDate = LocalDateTime.of(2020, 1, 1, 0, 0);
        }

        return new LocalDateTime[]{startDate, endDate};
    }

    private Map<BookingStatus, Long> getBookingStats(LocalDateTime startDate, LocalDateTime endDate, UUID ownerId) {
        List<Object[]> results = bookingRepository.countAllByStatus(startDate, endDate, ownerId);

        Map<BookingStatus, Long> actualCounts = results.stream()
                .collect(Collectors.toMap(
                        res -> (BookingStatus) res[0],
                        res -> (Long) res[1]
                ));

        Map<BookingStatus, Long> fullStats = new EnumMap<>(BookingStatus.class);
        for (BookingStatus status : BookingStatus.values()) {
            fullStats.put(status, actualCounts.getOrDefault(status, 0L));
        }
        return fullStats;
    }

    private Map<PaymentStatus, Long> getPaymentStats(LocalDateTime startDate, LocalDateTime endDate, UUID ownerId) {
        List<Object[]> results = paymentRepository.countByPaymentStatus(startDate, endDate, ownerId);
        Map<PaymentStatus, Long> pStats = results.stream()
                .collect(Collectors.toMap(
                        res -> (PaymentStatus) res[0],
                        res -> (Long) res[1]
                ));

        Map<PaymentStatus, Long> fullPaymentStats = new EnumMap<>(PaymentStatus.class);
        for (PaymentStatus status : PaymentStatus.values()) {
            fullPaymentStats.put(status, pStats.getOrDefault(status, 0L));
        }
        return fullPaymentStats;
    }

    private BigDecimal getTotalRevenue(LocalDateTime startDate, LocalDateTime endDate, UUID ownerId) {
        BigDecimal revenue = paymentRepository.getTotalRevenue(startDate, endDate, ownerId);
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    private List<Map<String, Object>> getTopCourts(LocalDateTime start, LocalDateTime end, UUID ownerId) {
        List<Object[]> results = bookingRepository.findTopCourtsByBookingCount(start, end, ownerId, PageRequest.of(0, 2));

        return results.stream().map(res -> {
            Map<String, Object> map = new HashMap<>();
            map.put("courtName", res[0]);
            map.put("bookingCount", res[1]);
            return map;
        }).collect(Collectors.toList());
    }

    // 1. Tính doanh thu 7 ngày gần nhất
    private List<Map<String, Object>> getDailyRevenueLast7Days(UUID ownerId) {
        List<Map<String, Object>> last7DaysRevenue = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime d = LocalDateTime.now().minusDays(i);
            LocalDateTime start = d.toLocalDate().atStartOfDay();
            LocalDateTime end = d.toLocalDate().atTime(23, 59, 59);

            BigDecimal rev = paymentRepository.getTotalRevenue(start, end, ownerId);

            Map<String, Object> point = new HashMap<>();
            point.put("date", d.getDayOfMonth() + "/" + d.getMonthValue());
            point.put("revenue", rev != null ? rev : BigDecimal.ZERO);
            last7DaysRevenue.add(point);
        }
        return last7DaysRevenue;
    }

    // 2. Lấy khung giờ cao điểm
    private String getPeakBookingHour(LocalDateTime startDate, LocalDateTime endDate, UUID ownerId) {
        List<Object[]> peakHoursRaw = bookingRepository.findPeakBookingHours(startDate, endDate, ownerId);
        if (peakHoursRaw != null && !peakHoursRaw.isEmpty()) {
            int hour = (int) peakHoursRaw.getFirst()[0];
            return hour + "h - " + (hour + 1) + "h";
        }
        return "N/A";
    }

    // 3. Tính tỷ lệ lấp đầy sân
    private Double calculateOccupancyRate(LocalDateTime startDate, LocalDateTime endDate, UUID ownerId) {
        Long bookedSlots = slotRepository.countByStatusAndDate(SlotStatus.BOOKED, startDate, endDate, ownerId);
        Long totalSlots = slotRepository.countTotalSlots(startDate, endDate, ownerId);

        if (totalSlots == null || totalSlots == 0) return 0.0;

        double rate = (bookedSlots * 100.0) / totalSlots;
        return Math.round(rate * 10) / 10.0; // Làm tròn 1 chữ số thập phân
    }

    // 4. Tính % tăng trưởng so với tháng trước
    private Double calculateRevenueGrowthPercentage(UUID ownerId) {
        LocalDateTime now = LocalDateTime.now();

        // Doanh thu tháng này (tính đến hiện tại)
        LocalDateTime startThisMonth = now.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
        BigDecimal thisMonthRev = paymentRepository.getTotalRevenue(startThisMonth, now, ownerId);
        if (thisMonthRev == null) thisMonthRev = BigDecimal.ZERO;

        // Doanh thu tháng trước (cùng kỳ hoặc cả tháng)
        LocalDateTime startLastMonth = now.minusMonths(1).with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
        LocalDateTime endLastMonth = now.minusMonths(1).with(TemporalAdjusters.lastDayOfMonth()).with(LocalTime.MAX);
        BigDecimal lastMonthRev = paymentRepository.getTotalRevenue(startLastMonth, endLastMonth, ownerId);

        if (lastMonthRev == null || lastMonthRev.compareTo(BigDecimal.ZERO) == 0) {
            return thisMonthRev.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }

        BigDecimal diff = thisMonthRev.subtract(lastMonthRev);
        return diff.divide(lastMonthRev, 4, RoundingMode.HALF_UP).doubleValue() * 100;
    }
}