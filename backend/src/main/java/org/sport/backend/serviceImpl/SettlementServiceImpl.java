package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.response.comission.MonthlySettlementDTO;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.repository.PaymentRepository;
import org.sport.backend.repository.RentalAreaRepository;
import org.sport.backend.service.CommissionConfigService;
import org.sport.backend.service.RentalAreaService;
import org.sport.backend.service.SettlementService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SettlementServiceImpl implements SettlementService {

    private final PaymentRepository paymentRepo;
    private final CommissionConfigService commissionService;
   private  final RentalAreaRepository rentalAreaRepository;
    @Override
    public List<MonthlySettlementDTO> calculateMonthlySettlements(int month, int year) {
        LocalDateTime startDate = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endDate = startDate.plusMonths(1).minusSeconds(1);

        // Lấy tất cả các tòa nhà có phát sinh doanh thu trong tháng
        List<UUID> activeRentalAreaIds = paymentRepo.findRentalAreasWithSuccessfulPayments(startDate, endDate);

        List<MonthlySettlementDTO> settlements = new ArrayList<>();
        for (UUID rentalAreaId : activeRentalAreaIds) {
            settlements.add(calculateSettlementForRentalArea(rentalAreaId, month, year));
        }

        return settlements;
    }

    @Override
    public MonthlySettlementDTO calculateSettlementForRentalArea(UUID rentalAreaId, int month, int year) {
        LocalDateTime startDate = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endDate = startDate.plusMonths(1).minusSeconds(1);

        // 1. Lấy tổng doanh thu và tổng số booking từ Database
        BigDecimal totalRevenue = paymentRepo.sumRevenueByRentalAreaAndDate(rentalAreaId, startDate, endDate);
        Long totalBookings = paymentRepo.countBookingsByRentalAreaAndDate(rentalAreaId, startDate, endDate);

        // 2. Lấy Tỉ lệ hoa hồng áp dụng
        BigDecimal rate = commissionService.getApplicableRate(rentalAreaId, totalBookings.intValue());

        // 3. Tính toán tiền hoa hồng và tiền thực trả chủ nhà
        // Tiền hoa hồng = Tổng doanh thu * Tỉ lệ (vd: rate = 0.1 cho 10%)
        BigDecimal commissionAmount = totalRevenue.multiply(rate);

        // Tiền trả chủ nhà = Tổng doanh thu - Hoa hồng
        BigDecimal payoutAmount = totalRevenue.subtract(commissionAmount);

        RentalArea area = rentalAreaRepository.findById(rentalAreaId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tòa nhà"));
        return MonthlySettlementDTO.builder()
                .rentalAreaId(rentalAreaId)
                .rentalAreaName(area.getRentalAreaName())
                .month(month)
                .year(year)
                .totalBookingsPaid(totalBookings)
                .totalRevenue(totalRevenue)
                .commissionRate(rate)
                .commissionAmount(commissionAmount)
                .payoutToOwner(payoutAmount)
                .build();
    }
}
