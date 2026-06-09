package org.sport.backend.dto.request.booking;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.sport.backend.constant.BookingType;
import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.dto.request.slot.SlotRequest;

import java.math.BigDecimal;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
public class OwnerBookingRequest {
    @NotBlank(message = "Tên khách hàng không được để trống")
    private String customerName;
    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;
    private String note;

    @DecimalMin(value = "0.0", inclusive = true, message = "Số tiền đã trả không được âm")
    private BigDecimal paidAmount;

    private BookingType bookingType;
    private Integer maxParticipants;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    @NotEmpty
    private List<SlotRequest> slots;
}