package org.sport.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.entity.BookingParticipant;
import org.sport.backend.repository.BookingParticipantRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketCleanupService {

    private final BookingParticipantRepository bookingParticipantRepository;

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cleanupExpiredPendingTickets() {
        LocalDateTime expireTime = LocalDateTime.now().minusMinutes(15);

        List<BookingParticipant> expiredTickets = bookingParticipantRepository.findPendingTicketsOlderThan(PaymentStatus.PENDING, expireTime);

        for (BookingParticipant ticket : expiredTickets) {
            if (ticket.getPaymentProofUrl() == null || ticket.getPaymentProofUrl().isEmpty()) {
                ticket.setPaymentStatus(PaymentStatus.CANCELLED);
                log.info("Auto-cancelled expired pending ticket: {}", ticket.getParticipantId());
            }
        }

        if (!expiredTickets.isEmpty()) {
            bookingParticipantRepository.saveAll(expiredTickets);
        }
    }
}