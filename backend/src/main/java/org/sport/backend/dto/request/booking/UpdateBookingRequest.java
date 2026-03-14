package org.sport.backend.dto.request.booking;

import lombok.Getter;
import lombok.Setter;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.dto.request.slot.UpdateSlotRequest;

import java.util.List;

@Getter
@Setter
public class UpdateBookingRequest {

    private String bookerName;

    private String bookerPhone;

    private String note;

    private BookingStatus bookingStatus;

    private List<UpdateSlotRequest> slots;
}