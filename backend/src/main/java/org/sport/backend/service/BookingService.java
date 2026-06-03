package org.sport.backend.service;

import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.request.booking.OwnerBookingRequest;
import org.sport.backend.dto.request.booking.UpdateBookingRequest;
import org.sport.backend.dto.request.serviceItem.AddExtraServicesRequest;
import org.sport.backend.dto.request.slot.SlotRequest;
import org.sport.backend.dto.response.booking.BookingIntentResponse;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.slot.CheckAvailabilityResponse;
import org.sport.backend.entity.Payment;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BookingService {
    PageResponse<BookingIntentResponse> getMyRentalBookingIntents(
            UUID rentalId,
            BookingIntentStatus status,
            int page,
            int size
    );
    List<BookingIntentResponse> getMyBookingIntents();
    BookingResponse ownerConfirmManualBooking(UUID intentId);
    String  uploadIntentPaymentProof(UUID bookingIntentId, MultipartFile image);
    BigDecimal previewOwnerBookingPrice(OwnerBookingRequest request);
    BookingResponse createOwnerBooking(OwnerBookingRequest request);
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

    void collectRemainingPayment(UUID bookingId);

    BookingResponse cancelBookingByUser(UUID bookingId);
}
