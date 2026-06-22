package org.sport.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.Match;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.repository.MatchRepository;
import org.sport.backend.service.MatchService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MatchScheduler {

    private final MatchRepository matchRepository;
    private final BookingRepository bookingRepository;

    private final MatchService matchService;

    @Scheduled(cron = "0 5 0 * * ?")
    public void scheduleMatchGeneration() {
        matchService.generateNextMatches();
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void autoCompleteMatches() {

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        List<MatchStatus> pendingStatuses = Arrays.asList(MatchStatus.READY, MatchStatus.WAITING_RESULT_APPROVAL);

        List<Match> matches = matchRepository
                .findByStatusInAndEndTimeBefore(pendingStatuses, startOfToday);

        if (matches.isEmpty()) {
            return;
        }

        List<Booking> bookingsToUpdate = new ArrayList<>();

        for (Match match : matches) {
            match.setStatus(MatchStatus.COMPLETED);

            if (match.getBooking() != null) {
                Booking booking = match.getBooking();
                booking.setBookingStatus(BookingStatus.COMPLETED);
                bookingsToUpdate.add(booking);
            }
        }

        matchRepository.saveAll(matches);

        if (!bookingsToUpdate.isEmpty()) {
            bookingRepository.saveAll(bookingsToUpdate);
        }

        log.info("LaceUP System (Nightly Job): Đã tự động chốt sổ {} trận đấu của ngày hôm qua.", matches.size());
    }

}
