package org.sport.backend.dto.request.booking;


import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import org.sport.backend.dto.request.slot.SlotRequest;

import java.util.List;
import java.util.UUID;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BookingRequest {
    private UUID userId;
    @NotNull(message = "Tên người đặt không được bỏ trống")
    private String userName;
    @NotNull(message = "Số điện thoại không được bỏ trống")
    private String userPhone;
    @Valid
    private List<SlotRequest> slotRequests;
    private String note;
}
