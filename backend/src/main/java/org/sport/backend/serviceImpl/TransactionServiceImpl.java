package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.MoneyFlow;
import org.sport.backend.constant.TransactionStatus;
import org.sport.backend.constant.TransactionType;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.transaction.TransactionRequest;
import org.sport.backend.dto.response.transaction.TransactionResponse;
import org.sport.backend.dto.response.transaction.TransactionSummaryResponse;
import org.sport.backend.entity.RentalArea;
import org.sport.backend.entity.Transaction;
import org.sport.backend.entity.User;
import org.sport.backend.repository.RentalAreaRepository;
import org.sport.backend.repository.TransactionRepository;
import org.sport.backend.service.TransactionService;
import org.sport.backend.specification.TransactionSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final RentalAreaRepository rentalAreaRepository;

    @Override
    public PageResponse<TransactionResponse> getRentalAreaTransactions(
            UUID rentalAreaId,
            int page,
            int size,
            String keyword,
            TransactionType type,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        Specification<Transaction> spec =
                TransactionSpecification.filterTransactions(
                        keyword,
                        type,
                        MoneyFlow.OWNER_COLLECTED,
                        startDate,
                        endDate
                );

        spec = spec.and((root, query, cb) ->
                cb.equal(root.get("rentalArea").get("rentalAreaId"), rentalAreaId)
        );

        Page<Transaction> transactionPage = transactionRepository.findAll(
                spec,
                PageRequest.of(page - 1, size)
        );

        List<TransactionResponse> responses = transactionPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(transactionPage, responses);
    }

    @Override
    public PageResponse<TransactionResponse> getOwnerTransactions(
            UUID ownerId,
            int page,
            int size,
            TransactionType type
    ) {
        Specification<Transaction> spec =
                TransactionSpecification.filterTransactions(
                        null,
                        type,
                        MoneyFlow.OWNER_COLLECTED,
                        null,
                        null
                );

        spec = spec.and((root, query, cb) ->
                cb.equal(root.get("owner").get("userId"), ownerId)
        );

        Page<Transaction> transactionPage = transactionRepository.findAll(
                spec,
                PageRequest.of(page - 1, size)
        );

        List<TransactionResponse> responses = transactionPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(transactionPage, responses);
    }

    @Override
    public PageResponse<TransactionResponse> getTransactions(
            int page,
            int size,
            String keyword,
            TransactionType type,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        Specification<Transaction> spec =
                TransactionSpecification.filterTransactions(
                        keyword,
                        type,
                        MoneyFlow.ADMIN_COLLECTED,
                        startDate,
                        endDate
                );

        Page<Transaction> transactionPage = transactionRepository.findAll(
                spec,
                PageRequest.of(page - 1, size)
        );

        List<TransactionResponse> responses = transactionPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(transactionPage, responses);
    }

    @Override
    public TransactionResponse createTransaction(
            TransactionRequest request
    ) {
        RentalArea rentalArea = null;
        User owner = null;

        if (request.getType() != TransactionType.INCOME
                && request.getType() != TransactionType.EXPENSE) {
            throw new RuntimeException("Owner chỉ được tạo giao dịch thu hoặc chi");
        }

        if (request.getRentalAreaId() != null) {
            rentalArea = rentalAreaRepository.findById(request.getRentalAreaId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy khu sân"));

            owner = rentalArea.getOwner();
        }

        Transaction transaction = Transaction.builder()
                .type(request.getType())
                .amount(request.getAmount())
                .description(request.getDescription())
                .referenceId(request.getReferenceId())
                .status(request.getStatus() != null
                        ? request.getStatus()
                        : TransactionStatus.SUCCESS)
                .paymentMethod(request.getPaymentMethod())
                .category(request.getCategory())
                .rentalArea(rentalArea)
                .owner(owner)
                .moneyFlow(MoneyFlow.OWNER_COLLECTED)
                .build();

        return mapToResponse(transactionRepository.save(transaction));
    }

    @Override
    public TransactionResponse updateTransaction(
            UUID id, TransactionRequest request
    ) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());

        return mapToResponse(transactionRepository.save(transaction));
    }

    @Override
    public TransactionSummaryResponse getRentalAreaTransactionSummary(
            UUID rentalAreaId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        LocalDate safeStartDate = startDate != null
                ? startDate : LocalDate.of(2000, 1, 1);

        LocalDate safeEndDate = endDate != null
                ? endDate : LocalDate.of(2099, 12, 31);

        BigDecimal totalIncome = transactionRepository.sumTotalIncomeByRentalArea(
                rentalAreaId,
                safeStartDate,
                safeEndDate
        );

        BigDecimal totalExpense = transactionRepository.sumTotalExpenseByRentalArea(
                rentalAreaId,
                safeStartDate,
                safeEndDate
        );

        BigDecimal systemTransferred = transactionRepository.sumSystemTransferredByRentalArea(
                rentalAreaId,
                safeStartDate,
                safeEndDate
        );

        BigDecimal netProfit = totalIncome
                .add(systemTransferred)
                .subtract(totalExpense);

        return TransactionSummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .systemTransferred(systemTransferred)
                .netProfit(netProfit)
                .build();
    }

    private TransactionResponse mapToResponse(Transaction entity) {
        return TransactionResponse.builder()
                .id(entity.getId())
                .type(entity.getType())
                .amount(entity.getAmount())
                .description(entity.getDescription())
                .referenceId(entity.getReferenceId())
                .transactionDate(entity.getTransactionDate())
                .paymentMethod(entity.getPaymentMethod())
                .status(entity.getStatus())
                .category(entity.getCategory())
                .moneyFlow(entity.getMoneyFlow())

                .bookingId(entity.getBooking() != null
                        ? entity.getBooking().getBookingId()
                        : null)

                .rentalAreaId(entity.getRentalArea() != null
                        ? entity.getRentalArea().getRentalAreaId()
                        : null)

                .rentalAreaName(entity.getRentalArea() != null
                        ? entity.getRentalArea().getRentalAreaName()
                        : null)

                .ownerId(entity.getOwner() != null
                        ? entity.getOwner().getUserId()
                        : null)

                .ownerName(entity.getOwner() != null
                        ? entity.getOwner().getUserName()
                        : null)

                .build();
    }
}