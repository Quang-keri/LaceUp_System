package org.sport.backend.dto.response.booking;

import lombok.*;
import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.dto.response.slot.IntentSlotResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingIntentResponse {

    private UUID bookingIntentId;


    private BigDecimal previewPrice;


    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal totalAmount;


    private BookingIntentStatus status;


    private LocalDateTime expiresAt;


    private String bookerName;
    private String bookerPhone;



    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String title;
    private String note;


    private List<IntentSlotResponse> slots;
}
