package org.sport.backend.ai.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.ai.service.KnowledgeService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiTrainingScheduler {

    private final KnowledgeService knowledgeService;

    @EventListener(ApplicationReadyEvent.class)
    public void trainOnStartup() {
        log.info("=== BẮT ĐẦU TỰ ĐỘNG NẠP DỮ LIỆU AI (KHI START SERVER) ===");
        try {
            knowledgeService.trainAiWithRentalAreas();
            knowledgeService.trainAiWithAvailableMatches();
            log.info("=== HOÀN TẤT NẠP DỮ LIỆU AI (STARTUP) ===");
        } catch (Exception e) {
            log.error("Lỗi khi nạp dữ liệu AI lúc khởi động: {}", e.getMessage());
        }
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void trainDaily() {
        log.info("=== BẮT ĐẦU TỰ ĐỘNG NẠP DỮ LIỆU AI (LỊCH TRÌNH MỖI NGÀY) ===");
        try {
            knowledgeService.trainAiWithRentalAreas();
            knowledgeService.trainAiWithAvailableMatches();
            log.info("=== HOÀN TẤT NẠP DỮ LIỆU AI (DAILY SCHEDULE) ===");
        } catch (Exception e) {
            log.error("Lỗi khi nạp dữ liệu AI theo lịch: {}", e.getMessage());
        }
    }

}