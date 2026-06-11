package org.sport.backend.scheduler;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.entity.BookingIntent;
import org.sport.backend.repository.BookingIntentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BookingIntentExpirationScheduler {

    private final BookingIntentRepository bookingIntentRepository;

    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void expireUnpaidBookingIntents() {
        List<BookingIntent> intents =
                bookingIntentRepository
                        .findAllByStatusAndExpiresAtLessThanEqual(
                                BookingIntentStatus.ACTIVE,
                                LocalDateTime.now()
                        );

        for (BookingIntent intent : intents) {
            intent.setStatus(BookingIntentStatus.EXPIRED);
        }

        bookingIntentRepository.saveAll(intents);
    }
}