package org.sport.backend.dto.response.booking;

import lombok.*;
import org.sport.backend.constant.BookingType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedBookingPublicResponse {

    private UUID bookingId;
    private BookingType bookingType;
    private BigDecimal pricePerTicket;
    private Long currentParticipants;
    private Long reservedParticipants;
    private Long remainingSlots;
    private Integer maxParticipants;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String courtName;
    private String courtCode;

}
