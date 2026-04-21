package org.sport.backend.service;

import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.request.booking.UpdateBookingRequest;
import org.sport.backend.dto.request.serviceItem.AddExtraServicesRequest;
import org.sport.backend.dto.request.slot.SlotRequest;
import org.sport.backend.dto.response.booking.BookingIntentResponse;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.slot.CheckAvailabilityResponse;
import org.sport.backend.entity.Payment;

import java.time.LocalDate;
import java.util.UUID;

public interface BookingService {

    void addExtraServices(UUID bookingId, AddExtraServicesRequest request);
    CheckAvailabilityResponse checkAvailability(SlotRequest request);
    BookingIntentResponse createBookingIntent(BookingRequest request);
    BookingIntentResponse getBookingIntentById(UUID bookingIntentId);
    BookingResponse confirmBooking(UUID bookingIntentId, Payment payment);

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

    PageResponse<BookingResponse> getMyBookings(BookingStatus bookingStatus, String keyword, LocalDate from, LocalDate to, int page, int size);

    BookingResponse updateBooking(UUID bookingId, UpdateBookingRequest request);

    String generateInvoiceUrl(UUID bookingId, String invoiceViewUrl);
    void collectRemainingPayment(UUID bookingId);
}
