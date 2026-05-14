package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.*;
import org.sport.backend.dto.request.settlement.PayoutConfirmRequest;
import org.sport.backend.dto.response.comission.MonthlySettlementDTO;
import org.sport.backend.dto.response.settlement.AdminSettlementSummaryResponse;
import org.sport.backend.dto.response.settlement.SettlementResponse;
import org.sport.backend.entity.*;
import org.sport.backend.repository.*;
import org.sport.backend.service.CommissionConfigService;
import org.sport.backend.service.SettlementService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SettlementServiceImpl implements SettlementService {

    private final PaymentRepository paymentRepo;
    private final CommissionConfigService commissionService;
    private final RentalAreaRepository rentalAreaRepository;
    private final SettlementRepository settlementRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Override
    public List<MonthlySettlementDTO> calculateMonthlySettlements(int month, int year) {
        LocalDateTime startDate = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endDate = startDate.plusMonths(1);

        List<UUID> activeRentalAreaIds =
                paymentRepo.findRentalAreasWithSuccessfulPayments(startDate, endDate);

        List<MonthlySettlementDTO> result = new ArrayList<>();

        for (UUID rentalAreaId : activeRentalAreaIds) {
            result.add(calculateSettlementForRentalArea(rentalAreaId, month, year));
        }

        return result;
    }

    @Override
    public MonthlySettlementDTO calculateSettlementForRentalArea(UUID rentalAreaId, int month, int year) {
        LocalDateTime startDate = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endDate = startDate.plusMonths(1);

        BigDecimal totalRevenue = paymentRepo.sumRevenueByRentalAreaAndDate(
                rentalAreaId,
                startDate,
                endDate
        );

        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        Long totalBookings = paymentRepo.countBookingsByRentalAreaAndDate(
                rentalAreaId,
                startDate,
                endDate
        );

        if (totalBookings == null) {
            totalBookings = 0L;
        }

        BigDecimal rate = commissionService.getApplicableRate(
                rentalAreaId,
                totalBookings.intValue()
        );

        BigDecimal commissionAmount = totalRevenue
                .multiply(rate)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal payoutAmount = totalRevenue
                .subtract(commissionAmount)
                .setScale(2, RoundingMode.HALF_UP);

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

    @Override
    @Transactional
    public void generateDailySettlements(LocalDate date) {
        List<RentalArea> rentalAreas = rentalAreaRepository.findAll();

        for (RentalArea rentalArea : rentalAreas) {
            UUID rentalAreaId = rentalArea.getRentalAreaId();

            // Tổng tiền sân dùng để tính hoa hồng
            BigDecimal bookingAmount =
                    transactionRepository.sumCommissionableBookingIncome(
                            rentalAreaId,
                            date
                    );

            // Tiền admin thực sự đang giữ, ví dụ: VNPay, chuyển khoản
            BigDecimal adminCollectedAmount =
                    transactionRepository.sumAdminCollectedBookingIncome(
                            rentalAreaId,
                            date
                    );

            if (bookingAmount == null) {
                bookingAmount = BigDecimal.ZERO;
            }

            if (adminCollectedAmount == null) {
                adminCollectedAmount = BigDecimal.ZERO;
            }

            if (adminCollectedAmount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal commissionRate = commissionService.getApplicableRate(rentalAreaId);

            // Hoa hồng chỉ tính trên tiền sân, không tính tiền nước/dịch vụ
            BigDecimal commissionAmount = bookingAmount
                    .multiply(commissionRate)
                    .setScale(2, RoundingMode.HALF_UP);

            // Owner chỉ nhận lại phần tiền admin đang giữ sau khi trừ hoa hồng
            BigDecimal ownerAmount = adminCollectedAmount
                    .subtract(commissionAmount)
                    .setScale(2, RoundingMode.HALF_UP);

            Optional<Settlement> existingOpt =
                    settlementRepository.findByRentalArea_RentalAreaIdAndSettlementDate(
                            rentalAreaId,
                            date
                    );

            Settlement settlement;

            if (existingOpt.isPresent()) {
                settlement = existingOpt.get();

                if (settlement.getStatus() == SettlementStatus.PAID) {
                    continue;
                }

                settlement.setGrossAmount(adminCollectedAmount);
                settlement.setCommissionRate(commissionRate);
                settlement.setCommissionAmount(commissionAmount);
                settlement.setOwnerAmount(ownerAmount);
                settlement.setStatus(SettlementStatus.PENDING);
            } else {
                settlement = Settlement.builder()
                        .rentalArea(rentalArea)
                        .settlementDate(date)
                        .grossAmount(adminCollectedAmount)
                        .commissionRate(commissionRate)
                        .commissionAmount(commissionAmount)
                        .ownerAmount(ownerAmount)
                        .status(SettlementStatus.PENDING)
                        .build();
            }

            settlementRepository.save(settlement);
        }
    }

    @Override
    public List<SettlementResponse> getSettlementsByDate(LocalDate date) {
        return settlementRepository.findBySettlementDate(date)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public AdminSettlementSummaryResponse getSummaryByDate(LocalDate date) {
        List<Settlement> settlements = settlementRepository.findBySettlementDate(date);

        BigDecimal totalGrossAmount = settlements.stream()
                .map(Settlement::getGrossAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCommissionAmount = settlements.stream()
                .map(Settlement::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOwnerAmount = settlements.stream()
                .map(Settlement::getOwnerAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaidAmount = settlements.stream()
                .filter(s -> s.getStatus() == SettlementStatus.PAID)
                .map(Settlement::getOwnerAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPendingAmount = settlements.stream()
                .filter(s -> s.getStatus() == SettlementStatus.PENDING)
                .map(Settlement::getOwnerAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminSettlementSummaryResponse.builder()
                .date(date)
                .totalGrossAmount(totalGrossAmount)
                .totalCommissionAmount(totalCommissionAmount)
                .totalOwnerAmount(totalOwnerAmount)
                .totalPaidAmount(totalPaidAmount)
                .totalPendingAmount(totalPendingAmount)
                .build();
    }

    @Override
    @Transactional
    public SettlementResponse markAsPaid(
            UUID settlementId,
            PayoutConfirmRequest request,
            UUID adminId
    ) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy settlement"));

        if (settlement.getStatus() == SettlementStatus.PAID) {
            throw new RuntimeException("Khoản này đã được thanh toán rồi");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy admin"));

        settlement.setStatus(SettlementStatus.PAID);
        settlement.setTransferCode(request.getTransferCode());
        settlement.setNote(request.getNote());
        settlement.setPaidAt(LocalDateTime.now());
        settlement.setPaidBy(admin);

        Settlement saved = settlementRepository.save(settlement);

        Transaction payoutTransaction = Transaction.builder()
                .type(TransactionType.PAYOUT)
                .amount(saved.getOwnerAmount())
                .description("Admin chuyển tiền cho owner sau đối soát ngày " + saved.getSettlementDate())
                .referenceId(saved.getSettlementId())
                .rentalArea(saved.getRentalArea())
                .owner(saved.getRentalArea().getOwner())
                .status(TransactionStatus.SUCCESS)
                .category(TransactionCategory.OWNER_PAYOUT)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .build();

        transactionRepository.save(payoutTransaction);

        return mapToResponse(saved);
    }

    private SettlementResponse mapToResponse(Settlement settlement) {
        return SettlementResponse.builder()
                .settlementId(settlement.getSettlementId())
                .rentalAreaId(settlement.getRentalArea().getRentalAreaId())
                .rentalAreaName(settlement.getRentalArea().getRentalAreaName())
                .settlementDate(settlement.getSettlementDate())
                .grossAmount(settlement.getGrossAmount())
                .commissionRate(settlement.getCommissionRate())
                .commissionAmount(settlement.getCommissionAmount())
                .ownerAmount(settlement.getOwnerAmount())
                .status(settlement.getStatus())
                .transferCode(settlement.getTransferCode())
                .note(settlement.getNote())
                .paidAt(settlement.getPaidAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SettlementResponse> getOwnerSettlements(UUID rentalAreaId) {
        return settlementRepository
                .findByRentalArea_RentalAreaIdOrderBySettlementDateDesc(rentalAreaId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

}
