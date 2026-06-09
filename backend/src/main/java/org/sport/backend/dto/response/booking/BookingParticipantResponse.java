package org.sport.backend.dto.response.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.dto.response.bank.BankAccountResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingParticipantResponse {
    private UUID participantId;
    private UUID bookingId;
    private UUID userId;
    private String userName;
    private String userPhone;
    private BigDecimal amountPaid;
    private PaymentStatus paymentStatus;
    private Boolean isHost;
    private Integer quantity;
    private BigDecimal pricePerTicket;
    private String paymentProofUrl;
    private LocalDateTime paymentProofUploadedAt;
    private BankAccountResponse bankAccount;
    private String courtName;
    private String courtCode;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String vietQrUrl;
}
