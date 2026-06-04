package org.sport.backend.scheduler;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.constant.MatchType;
import org.sport.backend.constant.ResultStatus;
import org.sport.backend.entity.Match;
import org.sport.backend.entity.MatchResult;
import org.sport.backend.event.MatchResultApprovedEvent;
import org.sport.backend.repository.MatchRepository;
import org.sport.backend.repository.MatchResultRepository;
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
    private final MatchResultRepository matchResultRepository;

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

//    @Scheduled(cron = "0 0 * * * *")
//    @Transactional
//    public void autoApproveExpiredResults() {
//        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
//
//        List<MatchResult> expiredResults = matchResultRepository.findPendingResultsOlderThan(threshold);
//
//        for (MatchResult result : expiredResults) {
//
//            result.setStatus(ResultStatus.APPROVED);
//            result.getMatch().setStatus(MatchStatus.COMPLETED);
//            matchRepository.save(result.getMatch());
//            matchResultRepository.save(result);
//
//            processCreditScore(result);
//            if (result.getMatch().getMatchType() == MatchType.RANKED) {
//                processRankedMatch(result);
//            } else if (result.getMatch().getMatchType() == MatchType.BET) {
//                processBetMatch(result);
//            }
//
//            notifyCourtOwnerAboutAbsence(result);
//            eventPublisher.publishEvent(new MatchResultApprovedEvent(result));
//        }
//    }
}
