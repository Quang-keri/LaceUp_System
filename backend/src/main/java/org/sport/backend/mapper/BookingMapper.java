package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.Role;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {
                AddressMapper.class,
                BookingMapperHelper.class
        },
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface BookingMapper {

    @Mapping(target = "userName", source = "bookerName")
    @Mapping(target = "phoneNumber", source = "bookerPhone")
    @Mapping(target = "invoicePdfUrl", source = "invoiceUrl")

    @Mapping(target = "status", source = "bookingStatus")

    @Mapping(
            target = "paymentMethod",
            source = ".",
            qualifiedByName = "getPaymentMethodStr"
    )

    @Mapping(
            target = "slots",
            source = "slots",
            qualifiedByName = "mapSlots"
    )

    @Mapping(
            target = "extraServiceResponses",
            source = ".",
            qualifiedByName = "mapExtraServices"
    )

    @Mapping(
            target = "depositAmount",
            source = "depositAmount",
            defaultExpression = "java(java.math.BigDecimal.ZERO)"
    )
    @Mapping(
            target = "remainingAmount",
            source = "remainingAmount",
            defaultExpression = "java(java.math.BigDecimal.ZERO)"
    )
    @Mapping(
            target = "totalPrice",
            source = "totalPrice",
            defaultExpression = "java(java.math.BigDecimal.ZERO)"
    )

    @Mapping(target = "bookingType", source = "bookingType")
    @Mapping(target = "maxParticipants", source = "maxParticipants")
    @Mapping(
            target = "currentParticipants",
            source = "currentParticipants",
            defaultValue = "0"
    )
    @Mapping(
            target = "pricePerTicket",
            source = "pricePerTicket",
            defaultExpression = "java(java.math.BigDecimal.ZERO)"
    )
    BookingResponse toBookingResponse(Booking booking);

    List<BookingResponse> toBookingResponseList(List<Booking> bookings);

    default String mapRoleToString(Role role) {
        if (role == null) {
            return null;
        }

        return role.getRoleName();
    }
}