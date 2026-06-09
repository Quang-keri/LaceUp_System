package org.sport.backend.mapper;

import lombok.RequiredArgsConstructor;
import org.mapstruct.Named;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.slot.SlotResponse;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.BookingServiceItem;
import org.sport.backend.entity.Court;
import org.sport.backend.entity.CourtCopy;
import org.sport.backend.entity.Payment;
import org.sport.backend.entity.Slot;
import org.sport.backend.repository.BookingServiceItemRepository;
import org.sport.backend.repository.PaymentRepository;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BookingMapperHelper {

    private final PaymentRepository paymentRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;

    @Named("getPaymentMethodStr")
    public String getPaymentMethodStr(Booking booking) {
        if (booking == null) {
            return "không có";
        }

        Optional<Payment> payment =
                paymentRepository.findFirstByBookingOrderByTransactionDateDesc(
                        booking
                );

        return payment
                .map(Payment::getPaymentMethod)
                .map(Enum::name)
                .orElse("không có");
    }

    @Named("mapSlots")
    public List<SlotResponse> mapSlots(List<Slot> slots) {
        if (slots == null || slots.isEmpty()) {
            return Collections.emptyList();
        }

        return slots.stream()
                .map(this::mapSingleSlot)
                .collect(Collectors.toList());
    }

    private SlotResponse mapSingleSlot(Slot slot) {
        CourtCopy courtCopy = slot.getCourtCopy();

        Court court = courtCopy != null
                ? courtCopy.getCourt()
                : null;

        return SlotResponse.builder()
                .slotId(slot.getSlotId())
                .courtCopyId(
                        courtCopy != null
                                ? courtCopy.getCourtCopyId()
                                : null
                )
                .courtCode(
                        courtCopy != null
                                ? courtCopy.getCourtCode()
                                : null
                )
                .courtName(
                        court != null
                                ? court.getCourtName()
                                : null
                )
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .price(slot.getPrice())
                .slotStatus(slot.getSlotStatus())
                .build();
    }

    @Named("mapExtraServices")
    public List<BookingResponse.BookingServiceResponse> mapExtraServices(
            Booking booking
    ) {
        if (booking == null) {
            return Collections.emptyList();
        }

        List<BookingServiceItem> items =
                bookingServiceItemRepository.findByBooking(booking);

        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }

        return items.stream()
                .map(item ->
                        BookingResponse.BookingServiceResponse.builder()
                                .serviceId(
                                        item.getServiceItem() != null
                                                ? item.getServiceItem()
                                                .getServiceItemId()
                                                : null
                                )
                                .serviceName(
                                        item.getServiceItem() != null
                                                ? item.getServiceItem()
                                                .getServiceName()
                                                : null
                                )
                                .quantity(item.getQuantity())
                                .price(item.getPrice())
                                .build()
                )
                .collect(Collectors.toList());
    }
}