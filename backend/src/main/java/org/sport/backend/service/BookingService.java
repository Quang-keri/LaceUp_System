package org.sport.backend.service;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.request.booking.UpdateBookingRequest;
import org.sport.backend.dto.response.booking.BookingIntentResponse;
import org.sport.backend.dto.response.booking.BookingResponse;

import java.time.LocalDate;
import java.util.UUID;

public interface BookingService {
    BookingIntentResponse createBookingIntent(BookingRequest request);

    BookingResponse confirmBooking(UUID bookingIntentId);

    BookingResponse getBookingById(UUID bookingId);

    PageResponse<BookingResponse> getAllBookings(
            BookingStatus bookingStatus,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    );

    PageResponse<BookingResponse> getBookingsRentalId(UUID rentalId, BookingStatus bookingStatus, String keyword, LocalDate from, LocalDate to, int page, int size);

    PageResponse<BookingResponse> getMyBookings(UUID userId, BookingStatus bookingStatus, String keyword, LocalDate from, LocalDate to, int page, int size);

    BookingResponse updateBooking(UUID bookingId, UpdateBookingRequest request);
}
