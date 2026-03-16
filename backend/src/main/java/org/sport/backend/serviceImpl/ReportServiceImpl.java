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
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate;
        LocalDateTime endDate = now;

        // Logic xử lý mốc thời gian
        if ("last_month".equals(range)) {
            // Lấy dữ liệu trọn vẹn tháng trước theo lịch
            LocalDateTime firstDayOfLastMonth = now.minusMonths(1).with(TemporalAdjusters.firstDayOfMonth());
            startDate = firstDayOfLastMonth.withHour(0).withMinute(0).withSecond(0).withNano(0);

            endDate = firstDayOfLastMonth.with(TemporalAdjusters.lastDayOfMonth()).withHour(23).withMinute(59).withSecond(59);
        } else {
            startDate = calculateStartDate(range);
            // Với các mốc khác như "all" hoặc "this_year", endDate vẫn là 'now'
        }

        Map<String, Object> fullDashboard = new HashMap<>();
        // Truyền cả startDate và endDate vào các hàm con
        fullDashboard.put("bookingStats", getBookingStats(startDate, endDate, ownerId));
        fullDashboard.put("paymentStats", getPaymentStats(startDate, endDate, ownerId));
        fullDashboard.put("totalRevenue", getTotalRevenue(startDate, endDate, ownerId));

        return fullDashboard;
    }

    private LocalDateTime calculateStartDate(String range) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.withHour(0).withMinute(0).withSecond(0).withNano(0);

        return switch (range) {
            case "24h" -> now.minusHours(24);
            case "7d" -> todayStart.minusDays(7);
            case "30d" -> todayStart.minusDays(30);
            case "this_year" -> now.with(TemporalAdjusters.firstDayOfYear()).withHour(0).withMinute(0);
            case "all" -> LocalDateTime.of(2020, 1, 1, 0, 0);
            default -> LocalDateTime.of(2020, 1, 1, 0, 0);
        };
    }

    private Map<BookingStatus, Long> getBookingStats(LocalDateTime startDate, LocalDateTime endDate, UUID ownerId) {
        // --- THÊM DÒNG NÀY ĐỂ DEBUG ---
        System.out.println("=== DEBUG BOOKING STATS ===");
        System.out.println("Range Start: " + startDate);
        System.out.println("Range End:   " + endDate);
        System.out.println("Owner ID:    " + (ownerId != null ? ownerId : "NULL (ADMIN)"));

        List<Object[]> results = bookingRepository.countAllByStatus(startDate, endDate, ownerId);

        System.out.println("Query Results Size: " + results.size());
        // ------------------------------

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
        // Cần cập nhật Repository để nhận 2 tham số
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