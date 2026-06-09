package org.sport.backend.service;

import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.response.booking.BookingIntentResponse;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface BookingIntentService {
    @Transactional
    BookingIntentResponse createBookingIntent(BookingRequest request);

    List<BookingIntentResponse> getMyBookingIntents();

    PageResponse<BookingIntentResponse> getMyRentalBookingIntents(
            UUID rentalId,
            BookingIntentStatus status,
            int page,
            int size
    );

    BookingIntentResponse getBookingIntentById(UUID bookingIntentId);

    @Transactional
    BookingResponse ownerConfirmManualBooking(UUID intentId);

    @Transactional
    void ownerRejectManualBooking(UUID intentId);

    @Transactional
    String uploadIntentPaymentProof(UUID intentId, MultipartFile image);
}
