package org.sport.backend.mapper;

import org.mapstruct.*;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.slot.SlotResponse;
import org.sport.backend.entity.*;
import org.sport.backend.repository.BookingServiceItemRepository;
import org.sport.backend.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = {AddressMapper.class})
public abstract class BookingMapper {

    @Autowired
    protected PaymentRepository paymentRepository;

    @Autowired
    protected BookingServiceItemRepository bookingServiceItemRepository;

    @Mapping(target = "userName", source = "bookerName")
    @Mapping(target = "phoneNumber", source = "bookerPhone")
    @Mapping(target = "invoicePdfUrl", source = "invoiceUrl")
    @Mapping(target = "paymentMethod", expression = "java(getPaymentMethodStr(booking))")
    @Mapping(target = "slots", expression = "java(mapSlots(booking.getSlots()))")
    @Mapping(target = "extraServiceResponses", expression = "java(mapExtraServices(booking))")
    @Mapping(target = "depositAmount", expression = "java(booking.getDepositAmount() != null ? booking.getDepositAmount() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "remainingAmount", expression = "java(booking.getRemainingAmount() != null ? booking.getRemainingAmount() : java.math.BigDecimal.ZERO)")
    @Mapping(target = "totalPrice", expression = "java(booking.getTotalPrice() != null ? booking.getTotalPrice() : java.math.BigDecimal.ZERO)")
    public abstract BookingResponse toBookingResponse(Booking booking);

    public abstract List<BookingResponse> toBookingResponseList(List<Booking> bookings);

    @Named("getPaymentMethodStr")
    protected String getPaymentMethodStr(Booking booking) {
        if (booking == null) return "không có";
        Optional<Payment> payment = paymentRepository.findFirstByBookingOrderByTransactionDateDesc(booking);
        return payment.map(p -> p.getPaymentMethod().toString()).orElse("không có");
    }

    @Named("mapSlots")
    protected List<SlotResponse> mapSlots(List<Slot> slots) {
        if (slots == null || slots.isEmpty()) return Collections.emptyList();

        return slots.stream()
                .map(slot -> SlotResponse.builder()
                        .slotId(slot.getSlotId())
                        .courtCopyId(slot.getCourtCopy() != null ? slot.getCourtCopy().getCourtCopyId() : null)
                        .courtCode(slot.getCourtCopy() != null ? slot.getCourtCopy().getCourtCode() : null)
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .price(slot.getPrice())
                        .slotStatus(slot.getSlotStatus())
                        .build())
                .collect(Collectors.toList());
    }

    @Named("mapExtraServices")
    protected List<BookingResponse.BookingServiceResponse> mapExtraServices(Booking booking) {
        if (booking == null) return Collections.emptyList();

        List<BookingServiceItem> items = bookingServiceItemRepository.findByBooking(booking);
        return items.stream()
                .map(bsi -> BookingResponse.BookingServiceResponse.builder()
                        .serviceId(bsi.getServiceItem() != null ? bsi.getServiceItem().getServiceItemId() : null)
                        .serviceName(bsi.getServiceItem() != null ? bsi.getServiceItem().getServiceName() : null)
                        .quantity(bsi.getQuantity())
                        .price(bsi.getPrice())
                        .build())
                .collect(Collectors.toList());
    }

    String mapRoleToString(Role role) {
        if (role == null) {
            return null;
        }
        return role.getRoleName();
    }
}