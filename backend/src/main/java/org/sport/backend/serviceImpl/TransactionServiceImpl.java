package org.sport.backend.serviceImpl;

import org.sport.backend.constant.TransactionType;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.transaction.TransactionRequest;
import org.sport.backend.dto.response.transaction.TransactionResponse;
import org.sport.backend.entity.Transaction;
import org.sport.backend.repository.TransactionRepository;
import org.sport.backend.service.TransactionService;
import org.sport.backend.specification.TransactionSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;


    @Override
    public PageResponse<TransactionResponse> getRentalAreaTransactions(
            UUID rentalAreaId,
            int page,
            int size,
            TransactionType type
    ) {
        Page<Transaction> transactionPage;

        if (type != null) {
            transactionPage =
                    transactionRepository.findByRentalArea_RentalAreaIdAndType(
                            rentalAreaId,
                            type,
                            PageRequest.of(page - 1, size)
                    );
        } else {
            transactionPage =
                    transactionRepository.findByRentalArea_RentalAreaId(
                            rentalAreaId,
                            PageRequest.of(page - 1, size)
                    );
        }

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
        Page<Transaction> transactionPage;

        if (type != null) {
            transactionPage = transactionRepository.findByOwner_UserIdAndType(
                    ownerId,
                    type,
                    PageRequest.of(page - 1, size)
            );
        } else {
            transactionPage = transactionRepository.findByOwner_UserId(
                    ownerId,
                    PageRequest.of(page - 1, size)
            );
        }

        List<TransactionResponse> responses = transactionPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(transactionPage, responses);
    }
    @Override
    public PageResponse<TransactionResponse> getTransactions(int page, int size, String keyword, TransactionType type, LocalDateTime startDate, LocalDateTime endDate) {
        Specification<Transaction> spec = TransactionSpecification.filterTransactions(keyword, type, startDate, endDate);
        Page<Transaction> transactionPage = transactionRepository.findAll(spec, PageRequest.of(page - 1, size));

        List<TransactionResponse> responses = transactionPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.of(transactionPage, responses);
    }

    @Override
    public TransactionResponse createTransaction(TransactionRequest request) {
        Transaction transaction = Transaction.builder()
                .type(request.getType())
                .amount(request.getAmount())
                .description(request.getDescription())
                .referenceId(request.getReferenceId())
                .build();
        return mapToResponse(transactionRepository.save(transaction));
    }

    @Override
    public TransactionResponse updateTransaction(UUID id, TransactionRequest request) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        transaction.setType(request.getType());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());


        return mapToResponse(transactionRepository.save(transaction));
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
