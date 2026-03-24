package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.PayoutStatus;
import org.sport.backend.dto.request.payout.PayoutRequestDTO;
import org.sport.backend.dto.response.comission.MonthlySettlementDTO;
import org.sport.backend.dto.response.payout.PayoutHistoryResponseDTO;
import org.sport.backend.entity.PayoutHistory;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.PayoutHistoryRepository;
import org.sport.backend.repository.RentalAreaRepository;
import org.sport.backend.service.PayoutHistoryService;
import org.sport.backend.service.SettlementService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayoutHistoryServiceImpl implements PayoutHistoryService {

    private final PayoutHistoryRepository payoutRepository;
    private final SettlementService settlementService;
     private final RentalAreaRepository rentalAreaRepository;

    @Override
    @Transactional
    public PayoutHistoryResponseDTO confirmPayout(PayoutRequestDTO request) {
        // 1. Kiểm tra xem tháng này đã thanh toán chưa
        boolean isAlreadyPaid = payoutRepository.existsByRentalArea_RentalAreaIdAndSettlementMonthAndSettlementYearAndStatus(
                request.getRentalAreaId(),
                request.getMonth(),
                request.getYear(),
                PayoutStatus.COMPLETED
        );

        if (isAlreadyPaid) {
            throw new RuntimeException("Tòa nhà này đã được thanh toán đối soát cho tháng " + request.getMonth() + "/" + request.getYear());
        }

        // 2. Tính toán lại số tiền chính xác từ hệ thống (Bảo mật)
        MonthlySettlementDTO settlementData = settlementService.calculateSettlementForRentalArea(
                request.getRentalAreaId(),
                request.getMonth(),
                request.getYear()
        );

        if (settlementData.getPayoutToOwner().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền cần thanh toán bằng 0, không thể tạo giao dịch.");
        }


        RentalArea rentalAreaRef = rentalAreaRepository.findById(request.getRentalAreaId())
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_AREA_NOT_FOUND));

        // 4. Lưu lịch sử
        PayoutHistory payoutHistory = PayoutHistory.builder()
                .rentalArea(rentalAreaRef)
                .settlementMonth(request.getMonth())
                .settlementYear(request.getYear())
                .totalRevenue(settlementData.getTotalRevenue())
                .commissionAmount(settlementData.getCommissionAmount())
                .payoutAmount(settlementData.getPayoutToOwner())
                .status(PayoutStatus.COMPLETED)
                .transactionReference(request.getTransactionReference())
                .note(request.getNote())
                .build();

        PayoutHistory savedPayout = payoutRepository.save(payoutHistory);

        // 5. Trả về Response
        return mapToResponse(savedPayout);
    }

    @Override
    public List<PayoutHistoryResponseDTO> getHistoryByRentalArea(UUID rentalAreaId) {
        return payoutRepository.findByRentalArea_RentalAreaIdOrderByCreatedAtDesc(rentalAreaId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PayoutHistoryResponseDTO mapToResponse(PayoutHistory entity) {
        return PayoutHistoryResponseDTO.builder()
                .payoutId(entity.getPayoutId())
                .rentalAreaId(entity.getRentalArea().getRentalAreaId())
                .month(entity.getSettlementMonth())
                .year(entity.getSettlementYear())
                .payoutAmount(entity.getPayoutAmount())
                .status(entity.getStatus())
                .transactionReference(entity.getTransactionReference())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}