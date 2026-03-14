package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.service.ReportService;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;

    @Override
    public Map<BookingStatus, Long> getDashboardStats() {
        // 1. Lấy dữ liệu thực tế từ DB
        List<Object[]> results = bookingRepository.countAllByStatus();

        // 2. Chuyển list object thành Map để dễ tra cứu
        Map<BookingStatus, Long> actualCounts = results.stream()
                .collect(Collectors.toMap(
                        res -> (BookingStatus) res[0],
                        res -> (Long) res[1]
                ));

        // 3. Đảm bảo tất cả các Status trong Enum đều xuất hiện (nếu ko có thì = 0)
        Map<BookingStatus, Long> fullStats = new EnumMap<>(BookingStatus.class);
        for (BookingStatus status : BookingStatus.values()) {
            fullStats.put(status, actualCounts.getOrDefault(status, 0L));
        }

        return fullStats;
    }
}
