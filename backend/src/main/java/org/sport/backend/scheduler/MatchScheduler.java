package org.sport.backend.scheduler;

import lombok.RequiredArgsConstructor;
import org.sport.backend.serviceImpl.MatchServiceImpl;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MatchScheduler {
    private final MatchServiceImpl recurringService;

    @Scheduled(cron = "0 5 0 * * ?")
    public void scheduleMatchGeneration() {
        recurringService.generateNextMatches();
    }
}
