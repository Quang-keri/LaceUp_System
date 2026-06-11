package org.sport.backend.service;

import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.response.booking.BookingParticipantResponse;
import org.sport.backend.dto.response.booking.SharedBookingPublicResponse;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SharedBookingService {
    @Transactional(readOnly = true)
    PageResponse<SharedBookingPublicResponse>
    getOpenSharedBookingsForCommunity(
            UUID rentalAreaId,
            int page,
            int size
    );

    @Transactional(readOnly = true)
    List<BookingParticipantResponse> getParticipantsForOwner(
            UUID bookingId
    );

    @Transactional(readOnly = true)
    BookingParticipantResponse getTicketParticipant(
            UUID participantId
    );

    BookingParticipantResponse joinSharedBooking(
            UUID bookingId,
            Integer quantity
    );

    @Transactional
    BookingParticipantResponse cancelSharedTicketByUser(UUID participantId);

    @Transactional
    BookingParticipantResponse uploadTicketPaymentProof(UUID participantId, MultipartFile image);

    @Transactional(readOnly = true)
    PageResponse<BookingParticipantResponse> getPendingTicketsForOwner(
            UUID rentalAreaId,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    );

    @Transactional
    void confirmSharedTicketPayment(UUID participantId, boolean isApproved);

    @Transactional
    boolean processMinimumParticipants(UUID bookingId);

    @Transactional
    boolean processMinimumParticipants(
            UUID bookingId,
            boolean force
    );

    @Transactional
    void cancelSharedTicketBySystem(UUID participantId);
}
