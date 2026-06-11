package org.sport.backend.dto.response.booking;

import lombok.*;
import org.sport.backend.constant.BookingStatus;
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
    private BookingStatus bookingStatus;
    private BigDecimal pricePerTicket;
    private Long currentParticipants;
    private Long reservedParticipants;
    private Long remainingSlots;
    private Integer maxParticipants;
    private Integer minParticipants;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String note;
    private UUID courtId;
    private String courtName;
    private String courtCode;
    private UUID rentalAreaId;
    private String rentalAreaName;
    private String categoryName;

}
