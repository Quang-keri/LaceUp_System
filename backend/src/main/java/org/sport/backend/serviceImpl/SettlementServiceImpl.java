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

    private final PaymentRepository paymentRepository;
    private final RentalAreaRepository rentalAreaRepository;
    private final SettlementRepository settlementRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final SlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final CommissionConfigService commissionService;

    @Override
    public List<MonthlySettlementDTO> calculateMonthlySettlements(int month, int year) {
        LocalDateTime startDate = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endDate = startDate.plusMonths(1);

        List<UUID> activeRentalAreaIds = rentalAreaRepository.findAll().stream()
                .map(RentalArea::getRentalAreaId)
                .filter(id -> bookingRepository.sumTotalAmountOfCompletedBookingsMonthly(id, startDate, endDate).compareTo(BigDecimal.ZERO) > 0)
                .toList();

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

        BigDecimal totalBookingAmount = bookingRepository.sumTotalAmountOfCompletedBookingsMonthly(rentalAreaId, startDate, endDate);
        if (totalBookingAmount == null) {
            totalBookingAmount = BigDecimal.ZERO;
        }

        BigDecimal adminCollectedAmount = transactionRepository.sumAdminCollectedForCompletedBookingsMonthly(rentalAreaId, startDate, endDate);
        if (adminCollectedAmount == null) {
            adminCollectedAmount = BigDecimal.ZERO;
        }

        Long totalBookings = bookingRepository.countCompletedBookingsMonthly(rentalAreaId, startDate, endDate);
        if (totalBookings == null) {
            totalBookings = 0L;
        }

        BigDecimal rate = commissionService.getApplicableRate(
                rentalAreaId,
                totalBookings.intValue()
        );

        BigDecimal commissionAmount = totalBookingAmount
                .multiply(rate)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal payoutAmount = adminCollectedAmount
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
                .totalRevenue(adminCollectedAmount)
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

            BigDecimal bookingRevenue = bookingRepository.sumSlotRevenueByDate(rentalAreaId, date);

            BigDecimal initialPaidAmount = bookingRepository.sumInitialPaidAmountByDate(rentalAreaId, date);

            BigDecimal matchJoinPaidAmount = paymentRepository.sumMatchJoinPaidAmount(rentalAreaId, date);

            bookingRevenue = bookingRevenue == null ? BigDecimal.ZERO : bookingRevenue;
            initialPaidAmount = initialPaidAmount == null ? BigDecimal.ZERO : initialPaidAmount;
            matchJoinPaidAmount = matchJoinPaidAmount == null ? BigDecimal.ZERO : matchJoinPaidAmount;

            initialPaidAmount = initialPaidAmount.add(matchJoinPaidAmount);

            BigDecimal extraServiceAmount = bookingServiceItemRepository.sumExtraServiceAmountOfCompletedBookings(rentalAreaId, date);
            extraServiceAmount = extraServiceAmount == null ? BigDecimal.ZERO : extraServiceAmount;

            if (bookingRevenue.compareTo(BigDecimal.ZERO) <= 0
                    && initialPaidAmount.compareTo(BigDecimal.ZERO) <= 0
                    && extraServiceAmount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal totalBaseRevenue = bookingRevenue.add(matchJoinPaidAmount);

            BigDecimal commissionRate = commissionService.getApplicableRate(rentalAreaId);

            BigDecimal commissionAmount = totalBaseRevenue
                    .multiply(commissionRate)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal ownerAmount = initialPaidAmount
                    .subtract(commissionAmount)
                    .setScale(2, RoundingMode.HALF_UP);

            if (ownerAmount.compareTo(BigDecimal.ZERO) < 0) {
                ownerAmount = BigDecimal.ZERO;
            }

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

                settlement.setBookingRevenue(bookingRevenue);
                settlement.setInitialPaidAmount(initialPaidAmount);
                settlement.setExtraServiceAmount(extraServiceAmount);


                settlement.setGrossAmount(initialPaidAmount);

                settlement.setCommissionRate(commissionRate);
                settlement.setCommissionAmount(commissionAmount);
                settlement.setOwnerAmount(ownerAmount);
                settlement.setStatus(SettlementStatus.PENDING);

            } else {
                settlement = Settlement.builder()
                        .rentalArea(rentalArea)
                        .settlementDate(date)

                        .bookingRevenue(bookingRevenue)
                        .initialPaidAmount(initialPaidAmount)
                        .extraServiceAmount(extraServiceAmount)

                        .grossAmount(initialPaidAmount)

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

        BigDecimal totalBookingRevenue = settlements.stream()
                .map(s -> s.getBookingRevenue() == null ? BigDecimal.ZERO : s.getBookingRevenue())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalInitialPaidAmount = settlements.stream()
                .map(s -> s.getInitialPaidAmount() == null ? BigDecimal.ZERO : s.getInitialPaidAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExtraServiceAmount = settlements.stream()
                .map(s -> s.getExtraServiceAmount() == null ? BigDecimal.ZERO : s.getExtraServiceAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCommissionAmount = settlements.stream()
                .map(s -> s.getCommissionAmount() == null ? BigDecimal.ZERO : s.getCommissionAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOwnerAmount = settlements.stream()
                .map(s -> s.getOwnerAmount() == null ? BigDecimal.ZERO : s.getOwnerAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaidAmount = settlements.stream()
                .filter(s -> s.getStatus() == SettlementStatus.PAID)
                .map(s -> s.getOwnerAmount() == null ? BigDecimal.ZERO : s.getOwnerAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPendingAmount = settlements.stream()
                .filter(s -> s.getStatus() == SettlementStatus.PENDING)
                .map(s -> s.getOwnerAmount() == null ? BigDecimal.ZERO : s.getOwnerAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return AdminSettlementSummaryResponse.builder()
                .date(date)
                .totalBookingRevenue(totalBookingRevenue)
                .totalInitialPaidAmount(totalInitialPaidAmount)
                .totalExtraServiceAmount(totalExtraServiceAmount)
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
                .referenceId(String.valueOf(saved.getSettlementId()))
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

                .bookingRevenue(settlement.getBookingRevenue())
                .initialPaidAmount(settlement.getInitialPaidAmount())
                .extraServiceAmount(settlement.getExtraServiceAmount())

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
