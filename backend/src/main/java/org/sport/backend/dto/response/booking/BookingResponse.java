package org.sport.backend.dto.response.booking;


import lombok.*;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.dto.response.rental.RentalAreaResponse;
import org.sport.backend.dto.response.slot.SlotResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private UUID bookingId;
    private BigDecimal totalPrice;
    private BookingStatus bookingStatus;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private List<SlotResponse> slots;
    private LocalDateTime createdAt;
    private RentalAreaResponse rentalArea;
    private String userName;
    private String phoneNumber;
    private BookingStatus status;
    private String invoicePdfUrl;
    private String note;
    private String paymentMethod;
}
