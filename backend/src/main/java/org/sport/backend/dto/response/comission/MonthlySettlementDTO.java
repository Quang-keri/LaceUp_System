package org.sport.backend.dto.response.comission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlySettlementDTO {
    private UUID rentalAreaId;
    private String rentalAreaName;
    private int month;
    private int year;
    private Long totalBookingsPaid;      // Tổng số lượng booking đã thanh toán
    private BigDecimal totalRevenue;     // Tổng tiền Admin đã thu (cọc + full)
    private BigDecimal commissionRate;   // Tỉ lệ hoa hồng áp dụng
    private BigDecimal commissionAmount; // Tiền hoa hồng Admin giữ lại
    private BigDecimal payoutToOwner;    // Tiền cần chuyển trả cho chủ nhà
}