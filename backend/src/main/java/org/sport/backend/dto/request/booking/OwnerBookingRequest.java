package org.sport.backend.dto.request.booking;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.dto.request.slot.SlotRequest;

import java.math.BigDecimal;
import java.util.List;

@Getter
public class OwnerBookingRequest {
    @NotBlank(message = "Tên khách hàng không được để trống")
    private String customerName;
    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;
    private String note;

    @NotNull(message = "Tổng số tiền không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Tổng số tiền không được âm")
    private BigDecimal totalPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Số tiền đã trả không được âm")
    private BigDecimal paidAmount;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    @NotEmpty
    private List<SlotRequest> slots;
}