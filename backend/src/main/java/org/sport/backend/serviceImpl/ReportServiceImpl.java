package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.repository.PaymentRepository;
import org.sport.backend.service.ReportService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public Map<String, Object> getFullDashboardStats(String range, UUID ownerId) {
        // Gọi hàm xử lý mốc thời gian trả về mảng 2 phần tử [startDate, endDate]
        LocalDateTime[] dates = calculateDateRange(range);
        LocalDateTime startDate = dates[0];
        LocalDateTime endDate = dates[1];

        Map<String, Object> fullDashboard = new HashMap<>();
        fullDashboard.put("bookingStats", getBookingStats(startDate, endDate, ownerId));
        fullDashboard.put("paymentStats", getPaymentStats(startDate, endDate, ownerId));
        fullDashboard.put("totalRevenue", getTotalRevenue(startDate, endDate, ownerId));

        fullDashboard.put("monthlyRevenue", getMonthlyRevenue(ownerId));

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
        LocalDateTime endDate = now; // Mặc định kết thúc là hiện tại

        // Các mốc thời gian dùng chung
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfToday = now.toLocalDate().atTime(23, 59, 59);

        switch (range) {
            case "today" -> {
                startDate = startOfToday;
                endDate = endOfToday;
            }
            case "yesterday" -> {
                startDate = startOfToday.minusDays(1);
                endDate = startOfToday.minusSeconds(1); // Cuối ngày hôm qua
            }
            case "this_week" -> {
                // Giả định tuần bắt đầu từ Thứ 2 (theo chuẩn ISO)
                startDate = now.with(java.time.DayOfWeek.MONDAY).toLocalDate().atStartOfDay();
            }
            case "7d" -> startDate = now.minusDays(7);
            case "this_month" -> {
                startDate = now.with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
            }
            case "30d" -> startDate = now.minusDays(30);
            case "last_month" -> {
                startDate = now.minusMonths(1).with(TemporalAdjusters.firstDayOfMonth()).toLocalDate().atStartOfDay();
                endDate = now.minusMonths(1).with(TemporalAdjusters.lastDayOfMonth()).toLocalDate().atTime(23, 59, 59);
            }
            case "this_year" -> {
                startDate = now.with(TemporalAdjusters.firstDayOfYear()).toLocalDate().atStartOfDay();
            }
            case "last_year" -> {
                startDate = now.minusYears(1).with(TemporalAdjusters.firstDayOfYear()).toLocalDate().atStartOfDay();
                endDate = now.minusYears(1).with(TemporalAdjusters.lastDayOfYear()).toLocalDate().atTime(23, 59, 59);
            }
            case "1y" -> startDate = now.minusYears(1);
            case "all" -> startDate = LocalDateTime.of(2020, 1, 1, 0, 0);
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
}