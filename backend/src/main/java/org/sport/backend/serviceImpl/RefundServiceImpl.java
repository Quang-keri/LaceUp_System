package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.*;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.payment.ProcessRefundRequest;
import org.sport.backend.dto.response.payment.RefundResponse;
import org.sport.backend.entity.*;
import org.sport.backend.repository.BookingParticipantRepository;
import org.sport.backend.repository.PaymentRepository;
import org.sport.backend.repository.TransactionRepository;
import org.sport.backend.service.EmailService;
import org.sport.backend.service.RefundService;
import org.sport.backend.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefundServiceImpl implements RefundService {

    private final PaymentRepository paymentRepository;
    private final BookingParticipantRepository bookingParticipantRepository;
    private final TransactionRepository transactionRepository;
    private final EmailService emailService;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RefundResponse> getAdminPendingRefunds(
            int page,
            int size
    ) {
        requireAdmin();
        validatePagination(page, size);

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by("transactionDate").descending()
        );

        Page<Payment> payments =
                paymentRepository.findAdminRefundsByStatus(
                        PaymentStatus.REFUND_PENDING,
                        PaymentMethod.VIET_QR,
                        pageable
                );

        return PageResponse.of(
                payments,
                mapToRefundResponses(
                        payments.getContent(),
                        true
                )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RefundResponse> getAdminCompletedRefunds(
            int page,
            int size
    ) {
        requireAdmin();
        validatePagination(page, size);

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by(
                        Sort.Order.desc("refundProcessedAt"),
                        Sort.Order.desc("transactionDate")
                )
        );

        Page<Payment> payments =
                paymentRepository.findAdminRefundsByStatuses(
                        List.of(
                                PaymentStatus.REFUNDED,
                                PaymentStatus.REFUND_FAILED
                        ),
                        PaymentMethod.VIET_QR,
                        pageable
                );

        return PageResponse.of(
                payments,
                mapToRefundResponses(
                        payments.getContent(),
                        true
                )
        );
    }

    @Override
    @Transactional
    public void processAdminRefund(
            UUID paymentId,
            ProcessRefundRequest request
    ) {
        requireAdmin();

        Payment payment =
                paymentRepository.findByIdForUpdate(paymentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy giao dịch hoàn tiền"
                                )
                        );

        if (payment.getPaymentMethod() == PaymentMethod.VIET_QR) {
            throw new RuntimeException(
                    "Khoản tiền này do chủ sân thu. Admin không được xử lý hoàn tiền"
            );
        }

        processRefundInternal(
                payment,
                request,
                MoneyFlow.ADMIN_COLLECTED
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RefundResponse> getOwnerPendingRefunds(
            UUID rentalAreaId,
            int page,
            int size
    ) {
        User owner = requireOwner();
        validatePagination(page, size);

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by("transactionDate").descending()
        );

        Page<Payment> payments =
                paymentRepository.findOwnerRefundsByStatus(
                        owner.getUserId(),
                        rentalAreaId,
                        PaymentStatus.REFUND_PENDING,
                        PaymentMethod.VIET_QR,
                        pageable
                );

        return PageResponse.of(
                payments,
                mapToRefundResponses(
                        payments.getContent(),
                        true
                )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RefundResponse> getOwnerCompletedRefunds(
            UUID rentalAreaId,
            int page,
            int size
    ) {
        User owner = requireOwner();
        validatePagination(page, size);

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by(
                        Sort.Order.desc("refundProcessedAt"),
                        Sort.Order.desc("transactionDate")
                )
        );

        Page<Payment> payments =
                paymentRepository.findOwnerRefundsByStatuses(
                        owner.getUserId(),
                        rentalAreaId,
                        List.of(
                                PaymentStatus.REFUNDED,
                                PaymentStatus.REFUND_FAILED
                        ),
                        PaymentMethod.VIET_QR,
                        pageable
                );

        return PageResponse.of(
                payments,
                mapToRefundResponses(
                        payments.getContent(),
                        true
                )
        );
    }

    @Override
    @Transactional
    public void processOwnerRefund(
            UUID paymentId,
            ProcessRefundRequest request
    ) {
        User currentOwner = requireOwner();

        Payment payment =
                paymentRepository.findByIdForUpdate(paymentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy giao dịch hoàn tiền"
                                )
                        );

        if (payment.getPaymentMethod() != PaymentMethod.VIET_QR) {
            throw new RuntimeException(
                    "Chủ sân chỉ được xử lý giao dịch VietQR do mình trực tiếp nhận"
            );
        }

        RentalArea rentalArea =
                resolveRentalArea(payment);

        if (rentalArea == null
                || rentalArea.getOwner() == null) {
            throw new RuntimeException(
                    "Không xác định được chủ sân chịu trách nhiệm hoàn tiền"
            );
        }

        if (!rentalArea
                .getOwner()
                .getUserId()
                .equals(currentOwner.getUserId())) {
            throw new RuntimeException(
                    "Bạn không có quyền xử lý khoản hoàn tiền của sân này"
            );
        }

        processRefundInternal(
                payment,
                request,
                MoneyFlow.OWNER_COLLECTED
        );
    }

    private void processRefundInternal(
            Payment payment,
            ProcessRefundRequest request,
            MoneyFlow moneyFlow
    ) {
        PaymentStatus currentStatus =
                payment.getPaymentStatus();

        if (currentStatus != PaymentStatus.REFUND_PENDING
                && currentStatus != PaymentStatus.REFUND_FAILED) {
            throw new RuntimeException(
                    "Giao dịch không ở trạng thái có thể xử lý hoàn tiền"
            );
        }

        boolean success =
                Boolean.TRUE.equals(request.getSuccess());

        String note =
                normalizeNote(
                        request.getNote(),
                        success
                );

        BookingParticipant participant =
                payment.getBookingParticipant();

        Booking booking =
                resolveBooking(payment);

        RentalArea rentalArea =
                resolveRentalArea(payment);

        User owner =
                rentalArea != null
                        ? rentalArea.getOwner()
                        : null;

        LocalDateTime processedAt =
                LocalDateTime.now();

        payment.setRefundNote(note);
        payment.setRefundProcessedAt(processedAt);

        if (success) {
            processSuccessfulRefund(
                    payment,
                    participant,
                    booking,
                    rentalArea,
                    owner,
                    processedAt,
                    note,
                    moneyFlow
            );
        } else {
            processFailedRefund(
                    payment,
                    participant
            );
        }

        paymentRepository.saveAndFlush(payment);

        scheduleResultEmail(
                payment,
                success,
                note
        );

        log.info(
                "Xử lý refund paymentId={}, success={}, moneyFlow={}",
                payment.getPaymentId(),
                success,
                moneyFlow
        );
    }

    private void processSuccessfulRefund(
            Payment payment,
            BookingParticipant participant,
            Booking booking,
            RentalArea rentalArea,
            User owner,
            LocalDateTime processedAt,
            String note,
            MoneyFlow moneyFlow
    ) {
        payment.setPaymentStatus(
                PaymentStatus.REFUNDED
        );

        if (participant != null) {
            participant.setPaymentStatus(
                    PaymentStatus.REFUNDED
            );

            bookingParticipantRepository.save(
                    participant
            );
        }

        String referenceId =
                resolveRefundTransactionCode(payment);

        Transaction refundTransaction =
                Transaction.builder()
                        .type(TransactionType.EXPENSE)
                        .amount(payment.getAmount())
                        .description(
                                "Hoàn tiền thành công - " + note
                        )
                        .status(TransactionStatus.SUCCESS)
                        .paymentMethod(
                                payment.getPaymentMethod()
                        )
                        .category(
                                TransactionCategory.REFUND
                        )
                        .moneyFlow(moneyFlow)
                        .booking(booking)
                        .rentalArea(rentalArea)
                        .owner(owner)
                        .referenceId(referenceId)
                        .transactionDate(processedAt)
                        .build();

        transactionRepository.save(
                refundTransaction
        );
    }

    private void processFailedRefund(
            Payment payment,
            BookingParticipant participant
    ) {
        payment.setPaymentStatus(
                PaymentStatus.REFUND_FAILED
        );

        if (participant != null) {
            participant.setPaymentStatus(
                    PaymentStatus.REFUND_FAILED
            );

            bookingParticipantRepository.save(
                    participant
            );
        }
    }

    private String normalizeNote(
            String rawNote,
            boolean success
    ) {
        String note =
                rawNote != null
                        ? rawNote.trim()
                        : "";

        if (!success && note.isBlank()) {
            throw new RuntimeException(
                    "Vui lòng nhập lý do hoàn tiền thất bại"
            );
        }

        if (note.length() > 1000) {
            throw new RuntimeException(
                    "Ghi chú không được vượt quá 1000 ký tự"
            );
        }

        if (note.isBlank()) {
            return "Đã chuyển khoản hoàn tiền thành công";
        }

        return note;
    }

    private void scheduleResultEmail(
            Payment payment,
            boolean success,
            String note
    ) {
        User recipient =
                payment.getUser();

        if (recipient == null
                || recipient.getEmail() == null
                || recipient.getEmail().isBlank()) {
            log.warn(
                    "Không gửi email hoàn tiền vì người dùng chưa có email. paymentId={}",
                    payment.getPaymentId()
            );
            return;
        }

        String email =
                recipient.getEmail();

        String userName =
                recipient.getUserName() != null
                        ? recipient.getUserName()
                        : "Khách hàng";

        BigDecimal amount =
                payment.getAmount();

        String source =
                resolveRefundSource(payment);

        String transactionCode =
                resolveRefundTransactionCode(payment);

        Runnable emailAction = () ->
                emailService.sendRefundResultEmail(
                        email,
                        userName,
                        amount,
                        source,
                        transactionCode,
                        success,
                        note
                );

        if (TransactionSynchronizationManager
                .isSynchronizationActive()) {

            TransactionSynchronizationManager
                    .registerSynchronization(
                            new TransactionSynchronization() {
                                @Override
                                public void afterCommit() {
                                    emailAction.run();
                                }
                            }
                    );

            return;
        }

        emailAction.run();
    }

    private Booking resolveBooking(
            Payment payment
    ) {
        if (payment.getBooking() != null) {
            return payment.getBooking();
        }

        if (payment.getBookingParticipant() != null) {
            return payment
                    .getBookingParticipant()
                    .getBooking();
        }

        return null;
    }

    private RentalArea resolveRentalArea(
            Payment payment
    ) {
        Booking booking =
                resolveBooking(payment);

        if (booking != null
                && booking.getRentalArea() != null) {
            return booking.getRentalArea();
        }

        if (payment.getMatchRegistration() != null
                && payment
                .getMatchRegistration()
                .getMatch() != null
                && payment
                .getMatchRegistration()
                .getMatch()
                .getCourt() != null) {

            return payment
                    .getMatchRegistration()
                    .getMatch()
                    .getCourt()
                    .getRentalArea();
        }

        return null;
    }

    private User requireAdmin() {
        User currentUser =
                userService.getCurrentUserEntity();

        if (currentUser.getRole() == null
                || !"ADMIN".equalsIgnoreCase(
                currentUser
                        .getRole()
                        .getRoleName()
        )) {
            throw new RuntimeException(
                    "Chỉ quản trị viên được xử lý khoản hoàn tiền này"
            );
        }

        return currentUser;
    }

    private User requireOwner() {
        User currentUser =
                userService.getCurrentUserEntity();

        if (currentUser.getRole() == null
                || !"OWNER".equalsIgnoreCase(
                currentUser
                        .getRole()
                        .getRoleName()
        )) {
            throw new RuntimeException(
                    "Chỉ chủ sân được xử lý khoản hoàn tiền này"
            );
        }

        return currentUser;
    }

    private List<RefundResponse> mapToRefundResponses(
            List<Payment> payments,
            boolean requireQr
    ) {
        return payments.stream()
                .map(payment -> {
                    User user = payment.getUser();

                    BankAccount bank =
                            user != null
                                    ? user.getBankAccount()
                                    : null;

                    RentalArea rentalArea =
                            resolveRentalArea(payment);

                    User owner =
                            rentalArea != null
                                    ? rentalArea.getOwner()
                                    : null;

                    MoneyFlow moneyFlow =
                            payment.getPaymentMethod()
                                    == PaymentMethod.VIET_QR
                                    ? MoneyFlow.OWNER_COLLECTED
                                    : MoneyFlow.ADMIN_COLLECTED;

                    String source =
                            resolveRefundSourceCode(payment);

                    String transactionCode =
                            resolveRefundTransactionCode(payment);

                    String bankName =
                            bank != null
                                    ? bank.getBankName()
                                    : null;

                    String accountNumber =
                            bank != null
                                    ? bank.getAccountNumber()
                                    : null;

                    String accountHolderName =
                            bank != null
                                    ? bank.getAccountHolderName()
                                    : null;

                    boolean shouldGenerateQr =
                            requireQr
                                    && payment.getPaymentStatus()
                                    != PaymentStatus.REFUNDED;

                    String qrCodeUrl =
                            shouldGenerateQr
                                    ? buildRefundQrUrl(
                                    payment,
                                    bankName,
                                    accountNumber,
                                    accountHolderName
                            )
                                    : null;

                    return RefundResponse.builder()
                            .paymentId(
                                    payment.getPaymentId()
                            )
                            .userName(
                                    user != null
                                            ? user.getUserName()
                                            : "Khách ẩn danh"
                            )
                            .phone(
                                    user != null
                                            ? user.getPhone()
                                            : null
                            )
                            .email(
                                    user != null
                                            ? user.getEmail()
                                            : null
                            )
                            .amount(
                                    payment.getAmount()
                            )
                            .paymentMethod(
                                    payment.getPaymentMethod() != null
                                            ? payment
                                            .getPaymentMethod()
                                            .name()
                                            : "UNKNOWN"
                            )
                            .orderCode(
                                    payment.getOrderCode() != null
                                            ? payment
                                            .getOrderCode()
                                            .toString()
                                            : ""
                            )
                            .transactionDate(
                                    payment.getTransactionDate()
                            )
                            .source(source)
                            .referenceCode(transactionCode)
                            .bankName(bankName)
                            .accountNumber(accountNumber)
                            .accountHolderName(
                                    accountHolderName
                            )
                            .qrCodeUrl(qrCodeUrl)
                            .refundStatus(
                                    payment.getPaymentStatus()
                            )
                            .refundNote(
                                    payment.getRefundNote()
                            )
                            .refundProcessedAt(
                                    payment.getRefundProcessedAt()
                            )
                            .rentalAreaId(
                                    rentalArea != null
                                            ? rentalArea.getRentalAreaId()
                                            : null
                            )
                            .rentalAreaName(
                                    rentalArea != null
                                            ? rentalArea.getRentalAreaName()
                                            : null
                            )
                            .ownerId(
                                    owner != null
                                            ? owner.getUserId()
                                            : null
                            )
                            .ownerName(
                                    owner != null
                                            ? owner.getUserName()
                                            : null
                            )
                            .moneyFlow(moneyFlow)
                            .refundResponsible(
                                    moneyFlow
                                            == MoneyFlow.OWNER_COLLECTED
                                            ? "OWNER"
                                            : "ADMIN"
                            )
                            .build();
                })
                .collect(Collectors.toList());
    }

    private String buildRefundQrUrl(
            Payment payment,
            String bankName,
            String accountNumber,
            String accountHolderName
    ) {
        if (bankName == null
                || bankName.isBlank()
                || accountNumber == null
                || accountNumber.isBlank()) {
            return null;
        }

        String transactionCode =
                resolveRefundTransactionCode(payment);

        String transferContent =
                "LACEUP HOAN TIEN " + transactionCode;

        String encodedContent =
                URLEncoder.encode(
                                transferContent,
                                StandardCharsets.UTF_8
                        )
                        .replace("+", "%20");

        String encodedAccountName =
                accountHolderName != null
                        ? URLEncoder.encode(
                                accountHolderName,
                                StandardCharsets.UTF_8
                        )
                        .replace("+", "%20")
                        : "";

        return String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png"
                        + "?amount=%d&addInfo=%s&accountName=%s",
                bankName.trim(),
                accountNumber.trim(),
                payment.getAmount().longValue(),
                encodedContent,
                encodedAccountName
        );
    }

    private String resolveRefundSourceCode(
            Payment payment
    ) {
        if (payment.getPaymentType()
                == PaymentType.SHARED_BOOKING) {
            return "SHARED_TICKET";
        }

        if (payment.getPaymentType()
                == PaymentType.MATCH_JOIN) {
            return "MATCH";
        }

        return "BOOKING";
    }

    private String resolveRefundSource(
            Payment payment
    ) {
        if (payment.getPaymentType()
                == PaymentType.SHARED_BOOKING) {
            return "Vé vãng lai";
        }

        if (payment.getPaymentType()
                == PaymentType.MATCH_JOIN) {
            return "Ghép trận";
        }

        return "Đặt sân";
    }

    private String resolveRefundTransactionCode(
            Payment payment
    ) {
        if (payment.getTransactionCode() != null
                && !payment.getTransactionCode().isBlank()) {
            return payment.getTransactionCode().trim();
        }

        if (payment.getOrderCode() != null) {
            return payment.getPaymentMethod() != null
                    ? payment.getPaymentMethod().name()
                    + "-"
                    + payment.getOrderCode()
                    : "ORDER-" + payment.getOrderCode();
        }

        return "PAY-"
                + payment.getPaymentId()
                .toString()
                .replace("-", "")
                .substring(0, 12)
                .toUpperCase();
    }

    private void validatePagination(
            int page,
            int size
    ) {
        if (page < 1) {
            throw new RuntimeException(
                    "Trang phải bắt đầu từ 1"
            );
        }

        if (size < 1 || size > 100) {
            throw new RuntimeException(
                    "Kích thước trang phải từ 1 đến 100"
            );
        }
    }
}