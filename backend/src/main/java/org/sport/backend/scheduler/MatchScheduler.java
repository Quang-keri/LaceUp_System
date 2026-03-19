package org.sport.backend.scheduler;

import lombok.RequiredArgsConstructor;
import org.sport.backend.serviceImpl.MatchServiceImpl;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MatchScheduler {
    private final MatchServiceImpl recurringService;

    // Chạy vào 00:05 mỗi ngày để chuẩn bị kèo cho các ngày tới
//    @Scheduled(cron = "0 5 0 * * ?")
    @Scheduled(cron = "0 */1 * * * ?")
    public void scheduleMatchGeneration() {
        recurringService.generateNextMatches();
    }
}
