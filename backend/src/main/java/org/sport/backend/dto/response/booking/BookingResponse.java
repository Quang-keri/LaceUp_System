package org.sport.backend.dto.response.booking;

import lombok.*;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.BookingType;
import org.sport.backend.constant.PaymentStatus;
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
    private String transactionCode;
    private String courtName;
    private String courtCode;
    private BigDecimal depositAmount;
    private BigDecimal remainingAmount;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private BigDecimal ownerAmount;
    private BigDecimal platformProfit;
    private Boolean ownerPaid;
    private LocalDateTime ownerPaidAt;

    private BookingType bookingType;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private BigDecimal pricePerTicket;

    private UUID participantId;
    private Integer ticketQuantity;
    private BigDecimal ticketAmount;
    private PaymentStatus ticketPaymentStatus;
    private String ticketPaymentProofUrl;
    private Boolean sharedTicketParticipant;
    private Integer minParticipants;
    private Boolean minimumCheckCompleted;
    private LocalDateTime minimumCheckedAt;

    private BigDecimal ticketCollectedAmount;
    private Integer activeTicketQuantity;
    private Integer cancelledNoRefundQuantity;
    private BigDecimal cancelledNoRefundAmount;

    private List<BookingServiceResponse> extraServiceResponses;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class BookingServiceResponse {
        private UUID serviceId;
        private String serviceName;
        private Integer quantity;
        private BigDecimal price;
    }
}
