package org.sport.backend.dto.response.booking;

import lombok.Builder;
import lombok.Getter;
import org.sport.backend.constant.BookingType;

import java.util.UUID;

@Getter
@Builder
public class BookingShortResponse {
    private UUID bookingId;
    private String userName;
    private String userPhone;
    private String note;
    private BookingType bookingType;
}
