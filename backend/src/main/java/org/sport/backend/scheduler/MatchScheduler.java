package org.sport.backend.scheduler;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.entity.Match;
import org.sport.backend.repository.MatchRepository;
import org.sport.backend.serviceImpl.MatchServiceImpl;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MatchScheduler {

    private final MatchRepository matchRepository;

    private final MatchServiceImpl recurringService;

    @Scheduled(cron = "0 5 0 * * ?")
    public void scheduleMatchGeneration() {
        recurringService.generateNextMatches();
    }

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void autoCompleteMatches() {

        List<Match> matches = matchRepository
                .findByStatusAndEndTimeBefore(
                        MatchStatus.READY,
                        LocalDateTime.now());

        for (Match match : matches) {

            match.setStatus(MatchStatus.COMPLETED);

            if (match.getBooking() != null) {
                match.getBooking().setBookingStatus(
                        BookingStatus.COMPLETED);
            }
        }
    }

}
