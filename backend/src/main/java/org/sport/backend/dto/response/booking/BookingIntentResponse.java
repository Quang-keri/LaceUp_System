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

    private LocalDateTime expiresAt;

    private BookingIntentStatus status;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private List<IntentSlotResponse> slots;
}
