package org.sport.backend.service;

import org.sport.backend.dto.request.booking.OwnerBookingRequest;
import org.sport.backend.dto.request.booking.UpdateBookingRequest;
import org.sport.backend.dto.request.serviceItem.AddExtraServicesRequest;
import org.sport.backend.dto.request.slot.SlotRequest;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.slot.CheckAvailabilityResponse;
import org.sport.backend.entity.Payment;

import java.math.BigDecimal;
import java.util.UUID;

public interface BookingService {

    BigDecimal previewOwnerBookingPrice(OwnerBookingRequest request);

    BookingResponse createOwnerBooking(OwnerBookingRequest request);

    void addExtraServices(UUID bookingId, AddExtraServicesRequest request);

    CheckAvailabilityResponse checkAvailability(SlotRequest request);

    BookingResponse confirmBooking(UUID bookingIntentId, Payment payment);

    BookingResponse updateBooking(UUID bookingId, UpdateBookingRequest request);

    void collectRemainingPayment(UUID bookingId);

    BookingResponse cancelBookingByUser(UUID bookingId);

}
