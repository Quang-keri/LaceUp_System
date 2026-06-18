package org.sport.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.BookingType;
import org.sport.backend.entity.Booking;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.service.SharedBookingService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SharedBookingMinimumScheduler {

    private final BookingRepository bookingRepository;
    private final SharedBookingService sharedBookingService;

    @Scheduled(cron = "0 */5 * * * *")
    public void checkMinimumParticipants() {
        LocalDateTime now =
                LocalDateTime.now();

        LocalDateTime deadline =
                now.plusMinutes(30);

        List<Booking> bookings =
                bookingRepository
                        .findSharedBookingsDueForMinimumCheck(
                                BookingType.SHARED,
                                BookingStatus.BOOKED,
                                now,
                                deadline
                        );

        for (Booking booking : bookings) {
            try {
                sharedBookingService
                        .processMinimumParticipants(
                                booking.getBookingId()
                        );
            } catch (Exception e) {
                log.error(
                        "Không thể kiểm tra min participant cho booking {}",
                        booking.getBookingId(),
                        e
                );
            }
        }
    }
}