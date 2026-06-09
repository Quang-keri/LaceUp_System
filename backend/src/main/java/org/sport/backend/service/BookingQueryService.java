package org.sport.backend.service;

import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.BookingType;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.booking.SharedBookingPublicResponse;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

public interface BookingQueryService {
    BookingResponse getBookingById(UUID bookingId);

    PageResponse<BookingResponse> getBookingsRentalId(
            UUID rentalId,
            BookingStatus bookingStatus,
            BookingType bookingType,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    );

    @Transactional(readOnly = true)
    SharedBookingPublicResponse getPublicSharedBooking(UUID bookingId);

    PageResponse<BookingResponse> getMyBookings(
            BookingStatus bookingStatus,
            BookingType bookingType,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    );

    PageResponse<BookingResponse> getAllBookings(
            BookingStatus bookingStatus,
            BookingType bookingType,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    );
}
