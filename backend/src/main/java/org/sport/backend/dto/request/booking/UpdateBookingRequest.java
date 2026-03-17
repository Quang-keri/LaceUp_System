package org.sport.backend.dto.request.booking;

import lombok.Getter;
import lombok.Setter;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.dto.request.slot.UpdateSlotRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

@Getter
@Setter
public class UpdateBookingRequest {

    @Size(min = 2, max = 100, message = "Tên phải từ 2 đến 100 ký tự")
    private String bookerName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "SĐT phải 10-11 chữ số")
    private String bookerPhone;

    @Size(max = 255, message = "Ghi chú không quá 255 ký tự")
    private String note;

    private BookingStatus bookingStatus;

    @Valid
    private List<UpdateSlotRequest> slots;
}