package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.*;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.sport.backend.dto.response.booking.BookingParticipantResponse;
import org.sport.backend.entity.*;
import org.sport.backend.repository.BookingParticipantRepository;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.repository.TransactionRepository;
import org.sport.backend.service.CloudinaryService;
import org.sport.backend.service.SharedBookingService;
import org.sport.backend.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SharedBookingServiceImpl implements SharedBookingService {

    private final BookingRepository bookingRepository;
    private final BookingParticipantRepository bookingParticipantRepository;
    private final TransactionRepository transactionRepository;

    private final UserService userService;
    private final CloudinaryService cloudinaryService;

    @Transactional(readOnly = true)
    @Override
    public BookingParticipantResponse getTicketParticipant(UUID participantId) {
        User currentUser = userService.getCurrentUserEntity();

        BookingParticipant participant = bookingParticipantRepository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin vé"));

        if (participant.getUser() == null || !participant.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Bạn không có quyền xem thông tin vé này");
        }

        return mapToResponse(participant);
    }

    @Transactional
    @Override
    public BookingParticipantResponse joinSharedBooking(
            UUID bookingId,
            Integer quantity
    ) {
        User currentUser = userService.getCurrentUserEntity();

        Booking booking = bookingRepository
                .findByIdForUpdate(bookingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy thông tin đặt vé vãng lai."
                        )
                );

        if (booking.getBookingType() != BookingType.SHARED) {
            throw new RuntimeException(
                    "Đây không phải là booking vãng lai."
            );
        }

        if (booking.getStartTime() == null
                || !booking.getStartTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Trận đấu đã bắt đầu hoặc đã kết thúc."
            );
        }

        int requestedQuantity = quantity != null ? quantity : 1;

        if (requestedQuantity < 1) {
            throw new RuntimeException(
                    "Số lượng người đăng ký không hợp lệ."
            );
        }

        if (booking.getPricePerTicket() == null
                || booking.getPricePerTicket()
                .compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException(
                    "Kèo chưa có thông tin giá vé hợp lệ."
            );
        }

        int maxParticipants = booking.getMaxParticipants() != null
                ? booking.getMaxParticipants()
                : 0;

        if (maxParticipants <= 0) {
            throw new RuntimeException(
                    "Kèo chưa cấu hình số người tối đa."
            );
        }

        BookingParticipant existingParticipant =
                bookingParticipantRepository
                        .findFirstByBooking_BookingIdAndUser_UserId(
                                bookingId,
                                currentUser.getUserId()
                        )
                        .orElse(null);

        if (existingParticipant != null
                && existingParticipant.getPaymentStatus()
                == PaymentStatus.PENDING) {

            return mapToResponse(existingParticipant);
        }

        if (existingParticipant != null
                && (
                existingParticipant.getPaymentStatus()
                        == PaymentStatus.SUCCESS
                        || existingParticipant.getPaymentStatus()
                        == PaymentStatus.BOOKED
                        || existingParticipant.getPaymentStatus()
                        == PaymentStatus.COMPLETED
        )) {
            throw new RuntimeException(
                    "Bạn đã tham gia kèo vãng lai này."
            );
        }

        long reservedParticipants =
                bookingParticipantRepository
                        .sumQuantityByBookingIdAndStatuses(
                                bookingId,
                                java.util.List.of(
                                        PaymentStatus.PENDING,
                                        PaymentStatus.SUCCESS
                                )
                        );

        int remainingSlots =
                maxParticipants - Math.toIntExact(reservedParticipants);

        if (remainingSlots <= 0) {
            throw new RuntimeException(
                    "Kèo vãng lai đã đủ người."
            );
        }

        if (requestedQuantity > remainingSlots) {
            throw new RuntimeException(
                    "Kèo chỉ còn "
                            + remainingSlots
                            + " chỗ trống."
            );
        }

        BigDecimal totalAmount = booking
                .getPricePerTicket()
                .multiply(
                        BigDecimal.valueOf(requestedQuantity)
                );

        if (existingParticipant != null) {
            existingParticipant.setQuantity(requestedQuantity);
            existingParticipant.setAmountPaid(totalAmount);
            existingParticipant.setPaymentStatus(
                    PaymentStatus.PENDING
            );
            existingParticipant.setIsHost(false);

            existingParticipant.setPaymentProofUrl(null);
            existingParticipant.setPaymentProofPublicId(null);
            existingParticipant.setPaymentProofUploadedAt(null);

            BookingParticipant saved =
                    bookingParticipantRepository.saveAndFlush(
                            existingParticipant
                    );

            return mapToResponse(saved);
        }

        BookingParticipant participant =
                BookingParticipant.builder()
                        .booking(booking)
                        .user(currentUser)
                        .quantity(requestedQuantity)
                        .amountPaid(totalAmount)
                        .paymentStatus(PaymentStatus.PENDING)
                        .isHost(false)
                        .build();

        BookingParticipant saved =
                bookingParticipantRepository.saveAndFlush(
                        participant
                );

        return mapToResponse(saved);
    }

    @Transactional
    @Override
    public BookingParticipantResponse uploadTicketPaymentProof(UUID participantId, MultipartFile image) {
        User currentUser = userService.getCurrentUserEntity();

        if (image == null || image.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn hình ảnh biên lai chuyển khoản.");
        }

        BookingParticipant participant = bookingParticipantRepository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin lượt tham gia."));

        if (participant.getUser() == null || !participant.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Bạn không có quyền cập nhật vé này.");
        }

        if (participant.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new RuntimeException("Vé này đã được thanh toán thành công.");
        }

        CloudinaryUploadResult uploadResult = cloudinaryService.uploadImage(
                image,
                "ticket-proofs/" + participant.getBooking().getBookingId() + "/" + participantId
        );

        participant.setPaymentProofUrl(uploadResult.getUrl());
        participant.setPaymentProofPublicId(uploadResult.getPublicId());
        participant.setPaymentProofUploadedAt(LocalDateTime.now());
        participant.setPaymentStatus(PaymentStatus.PENDING);

        BookingParticipant saved = bookingParticipantRepository.save(participant);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponse<BookingParticipantResponse> getPendingTicketsForOwner(
            UUID rentalAreaId,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException(
                    "Ngày bắt đầu không được lớn hơn ngày kết thúc"
            );
        }

        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);

        LocalDateTime fromTime = from != null
                ? from.atStartOfDay()
                : null;

        LocalDateTime toTimeExclusive = to != null
                ? to.plusDays(1).atStartOfDay()
                : null;

        boolean hasFrom = fromTime != null;
        boolean hasTo = toTimeExclusive != null;

        Pageable pageable = PageRequest.of(
                safePage - 1,
                safeSize
        );

        Page<BookingParticipant> participantPage =
                bookingParticipantRepository.findPendingTicketsForOwner(
                        rentalAreaId,
                        hasFrom,
                        fromTime,
                        hasTo,
                        toTimeExclusive,
                        pageable
                );

        List<BookingParticipantResponse> responses =
                participantPage.getContent()
                        .stream()
                        .map(this::mapToResponse)
                        .toList();

        return PageResponse.<BookingParticipantResponse>builder()
                .currentPage(safePage)
                .pageSize(safeSize)
                .totalPages(participantPage.getTotalPages())
                .totalElements(participantPage.getTotalElements())
                .data(responses)
                .build();
    }

    @Transactional
    @Override
    public void confirmSharedTicketPayment(UUID participantId, boolean isApproved) {
        BookingParticipant participant = bookingParticipantRepository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin vé"));

        if (participant.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Vé này không ở trạng thái chờ duyệt");
        }

        Booking booking = participant.getBooking();
        RentalArea rentalArea = booking.getRentalArea();
        User currentUser = userService.getCurrentUserEntity();

        // Ràng buộc bảo mật: Chỉ Owner của sân mới được duyệt
        if (rentalArea == null || rentalArea.getOwner() == null ||
                !rentalArea.getOwner().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Bạn không có quyền duyệt vé của sân này");
        }

        if (isApproved) {
            participant.setPaymentStatus(PaymentStatus.SUCCESS);

            // Khóa biến: Chỉ khi Owner duyệt, số lượng người tham gia thực tế mới tăng lên
            int currentCount = booking.getCurrentParticipants() != null ? booking.getCurrentParticipants() : 0;
            booking.setCurrentParticipants(currentCount + participant.getQuantity());
            bookingRepository.save(booking);

            // Ghi nhận dòng tiền cho Owner
            Transaction transaction = Transaction.builder()
                    .type(TransactionType.INCOME)
                    .amount(participant.getAmountPaid())
                    .description("Xác nhận thanh toán vé vãng lai VietQR - " + participant.getUser().getUserName())
                    .status(TransactionStatus.SUCCESS)
                    .paymentMethod(PaymentMethod.VIET_QR)
                    .category(TransactionCategory.BOOKING_FULL_PAYMENT)
                    .moneyFlow(MoneyFlow.OWNER_COLLECTED)
                    .rentalArea(rentalArea)
                    .owner(rentalArea.getOwner())
                    .booking(booking)
                    .transactionDate(LocalDateTime.now())
                    .referenceId(participant.getParticipantId().toString())
                    .build();
            transactionRepository.save(transaction);

        } else {
            // Trả về FAILED để giải phóng slot cho người khác
            participant.setPaymentStatus(PaymentStatus.FAILED);
        }

        bookingParticipantRepository.save(participant);
    }

    @Transactional
    @Override
    public void cancelSharedTicketBySystem(UUID participantId) {
        BookingParticipant participant =
                bookingParticipantRepository
                        .findById(participantId)
                        .orElse(null);

        if (participant == null
                || participant.getPaymentStatus()
                == PaymentStatus.SUCCESS
                || participant.getPaymentStatus()
                == PaymentStatus.BOOKED
                || participant.getPaymentStatus()
                == PaymentStatus.COMPLETED
                || participant.getPaymentStatus()
                == PaymentStatus.CANCELLED) {
            return;
        }

        participant.setPaymentStatus(
                PaymentStatus.CANCELLED
        );

        participant.setPaymentProofUrl(null);
        participant.setPaymentProofPublicId(null);
        participant.setPaymentProofUploadedAt(null);

        bookingParticipantRepository.save(participant);
    }

    private BookingParticipantResponse mapToResponse(BookingParticipant p) {
        Booking booking = p.getBooking();

        var firstSlot = Optional.ofNullable(booking.getSlots()).orElse(java.util.List.of()).stream().findFirst().orElse(null);
        String courtName = firstSlot != null && firstSlot.getCourtCopy() != null && firstSlot.getCourtCopy().getCourt() != null ? firstSlot.getCourtCopy().getCourt().getCourtName() : null;
        String courtCode = firstSlot != null && firstSlot.getCourtCopy() != null ? firstSlot.getCourtCopy().getCourtCode() : null;

        org.sport.backend.entity.RentalArea rentalArea = booking.getRentalArea();
        org.sport.backend.entity.User owner = rentalArea != null ? rentalArea.getOwner() : null;
        org.sport.backend.entity.BankAccount bank = owner != null ? owner.getBankAccount() : null;

        BankAccountResponse bankAccountResponse = null;
        String qrUrl = null;

        if (bank != null && bank.getBankName() != null && bank.getAccountNumber() != null) {
            bankAccountResponse = BankAccountResponse.builder()
                    .bankAccountId(bank.getBankAccountId())
                    .bankName(bank.getBankName())
                    .accountNumber(bank.getAccountNumber())
                    .accountHolderName(bank.getAccountHolderName())
                    .branchName(bank.getBranchName())
                    .qrCode(bank.getQrCode())
                    .isVerified(bank.getIsVerified())
                    .build();

            try {
                String amount = p.getAmountPaid() != null ? p.getAmountPaid().toBigInteger().toString() : "0";
                String info = "LACEUP " + p.getParticipantId().toString().substring(0, 8).toUpperCase();
                String encodedInfo = java.net.URLEncoder.encode(info, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
                String encodedName = bank.getAccountHolderName() != null ?
                        java.net.URLEncoder.encode(bank.getAccountHolderName(), java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20") : "";

                qrUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                        bank.getBankName().trim(), bank.getAccountNumber().trim(), amount, encodedInfo, encodedName);
            } catch (Exception e) {
            }
        }

        return BookingParticipantResponse.builder()
                .participantId(p.getParticipantId())
                .bookingId(booking.getBookingId())
                .userId(p.getUser().getUserId())
                .userName(p.getUser().getUserName())
                .userPhone(p.getUser().getPhone())
                .amountPaid(p.getAmountPaid())
                .paymentStatus(p.getPaymentStatus())
                .isHost(p.getIsHost())
                .quantity(p.getQuantity())
                .pricePerTicket(booking.getPricePerTicket())
                .paymentProofUrl(p.getPaymentProofUrl())
                .paymentProofUploadedAt(p.getPaymentProofUploadedAt())

                .bankAccount(bankAccountResponse)
                .courtName(courtName)
                .courtCode(courtCode)
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .vietQrUrl(qrUrl)
                .build();
    }
}