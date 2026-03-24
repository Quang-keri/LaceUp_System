package org.sport.backend.dto.request.payout;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayoutRequestDTO {
    private UUID rentalAreaId;
    private int month;
    private int year;
    private String transactionReference; // Bắt buộc khi confirm thanh toán
    private String note;
}
