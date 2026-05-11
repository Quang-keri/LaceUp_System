package org.sport.backend.dto.request.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.sport.backend.dto.request.slot.SlotRequest;

import java.math.BigDecimal;
import java.util.List;

@Getter
public class OwnerBookingRequest {
    @NotBlank(message = "Tên khách hàng không được để trống")
    private String customerName;

    private String phone;
    private String note;

    @NotNull
    private BigDecimal totalPrice;

    private BigDecimal paidAmount; // Khách đã thanh toán (có thể trả trước 1 phần, trả đủ, hoặc nợ)

    @NotEmpty
    private List<SlotRequest> slots; // Bao gồm courtCopyId, startTime, endTime
}