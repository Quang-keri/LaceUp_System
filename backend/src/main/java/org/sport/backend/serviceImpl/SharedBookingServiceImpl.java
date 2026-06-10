package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.*;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.sport.backend.dto.response.booking.BookingParticipantResponse;
import org.sport.backend.entity.*;
import org.sport.backend.repository.*;
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
    private final PaymentRepository paymentRepository;
    private final SlotRepository slotRepository;

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
                        .findTopByBooking_BookingIdAndUser_UserIdOrderByCreatedAtDesc(
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
    public BookingParticipantResponse cancelSharedTicketByUser(
            UUID participantId
    ) {
        User currentUser = userService.getCurrentUserEntity();

        BookingParticipant participant =
                bookingParticipantRepository
                        .findById(participantId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy thông tin vé"
                                )
                        );

        if (participant.getUser() == null
                || !participant
                .getUser()
                .getUserId()
                .equals(currentUser.getUserId())) {
            throw new RuntimeException(
                    "Bạn không có quyền hủy vé này"
            );
        }

        PaymentStatus currentStatus =
                participant.getPaymentStatus();

        if (currentStatus == PaymentStatus.CANCELLED
                || currentStatus == PaymentStatus.CANCELLED_NO_REFUND) {
            throw new RuntimeException(
                    "Vé này đã được hủy trước đó"
            );
        }

        if (currentStatus == PaymentStatus.REFUND_PENDING
                || currentStatus == PaymentStatus.REFUND_FAILED
                || currentStatus == PaymentStatus.REFUNDED) {
            throw new RuntimeException(
                    "Vé này đang hoặc đã được xử lý hoàn tiền"
            );
        }

        Booking booking = participant.getBooking();

        if (booking == null) {
            throw new RuntimeException(
                    "Không tìm thấy booking của vé"
            );
        }

        if (booking.getStartTime() != null
                && !booking.getStartTime()
                .isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Không thể hủy vé vì khung giờ đã bắt đầu hoặc kết thúc"
            );
        }

        boolean wasPaid =
                currentStatus == PaymentStatus.SUCCESS
                        || currentStatus == PaymentStatus.BOOKED
                        || currentStatus == PaymentStatus.COMPLETED;

        if (wasPaid) {
            int currentCount =
                    booking.getCurrentParticipants() != null
                            ? booking.getCurrentParticipants()
                            : 0;

            int quantity =
                    participant.getQuantity() != null
                            ? participant.getQuantity()
                            : 1;

            booking.setCurrentParticipants(
                    Math.max(0, currentCount - quantity)
            );

            bookingRepository.save(booking);

            /*
             * Người dùng tự hủy vé đã thanh toán:
             * giữ nguyên Payment SUCCESS để bảo toàn lịch sử thu tiền,
             * participant chuyển CANCELLED_NO_REFUND.
             */
            participant.setPaymentStatus(
                    PaymentStatus.CANCELLED_NO_REFUND
            );
        } else {
            participant.setPaymentStatus(
                    PaymentStatus.CANCELLED
            );

            cancelPendingPaymentsForParticipant(
                    participant
            );
        }

        participant.setPaymentProofUrl(null);
        participant.setPaymentProofPublicId(null);
        participant.setPaymentProofUploadedAt(null);

        BookingParticipant saved =
                bookingParticipantRepository
                        .saveAndFlush(participant);

        return mapToResponse(saved);
    }

    @Transactional
    @Override
    public BookingParticipantResponse uploadTicketPaymentProof(
            UUID participantId,
            MultipartFile image
    ) {
        BookingParticipant participant =
                bookingParticipantRepository
                        .findById(participantId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy thông tin vé"
                                )
                        );

        User currentUser =
                userService.getCurrentUserEntity();

        if (participant.getUser() == null
                || !participant
                .getUser()
                .getUserId()
                .equals(currentUser.getUserId())) {
            throw new RuntimeException(
                    "Bạn không có quyền tải biên lai cho vé này"
            );
        }

        PaymentStatus currentStatus =
                participant.getPaymentStatus();

        if (currentStatus == PaymentStatus.SUCCESS
                || currentStatus == PaymentStatus.BOOKED
                || currentStatus == PaymentStatus.COMPLETED) {
            throw new RuntimeException(
                    "Vé này đã được thanh toán"
            );
        }

        if (currentStatus == PaymentStatus.CANCELLED
                || currentStatus == PaymentStatus.CANCELLED_NO_REFUND
                || currentStatus == PaymentStatus.REFUND_PENDING
                || currentStatus == PaymentStatus.REFUND_FAILED
                || currentStatus == PaymentStatus.REFUNDED) {
            throw new RuntimeException(
                    "Vé này không còn hợp lệ để thanh toán"
            );
        }

        Booking booking =
                participant.getBooking();

        if (booking == null
                || booking.getBookingType() != BookingType.SHARED) {
            throw new RuntimeException(
                    "Booking này không phải trận vãng lai"
            );
        }

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException(
                    "Kèo vãng lai đã bị hủy"
            );
        }

        if (booking.getStartTime() == null
                || !booking
                .getStartTime()
                .isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Kèo vãng lai đã bắt đầu hoặc đã kết thúc"
            );
        }

        if (image == null || image.isEmpty()) {
            throw new RuntimeException(
                    "Vui lòng chọn ảnh biên lai"
            );
        }

        CloudinaryUploadResult uploadResult =
                cloudinaryService.uploadImage(
                        image,
                        "payment_proofs/shared_tickets"
                );

        String proofUrl =
                uploadResult.getUrl();

        String proofPublicId =
                uploadResult.getPublicId();

        if (proofUrl == null || proofUrl.isBlank()) {
            throw new RuntimeException(
                    "Không thể tải ảnh biên lai lên hệ thống"
            );
        }

        BigDecimal paymentAmount =
                resolveParticipantAmount(
                        participant,
                        booking
                );

        participant.setAmountPaid(paymentAmount);
        participant.setPaymentProofUrl(proofUrl);
        participant.setPaymentProofPublicId(proofPublicId);
        participant.setPaymentProofUploadedAt(
                LocalDateTime.now()
        );
        participant.setPaymentStatus(
                PaymentStatus.PENDING
        );

        bookingParticipantRepository
                .saveAndFlush(participant);

        Payment payment =
                getOrCreatePendingVietQrPayment(
                        participant,
                        booking,
                        currentUser
                );

        payment.setAmount(paymentAmount);
        payment.setBooking(booking);
        payment.setBookingParticipant(participant);
        payment.setUser(currentUser);
        payment.setPaymentMethod(
                PaymentMethod.VIET_QR
        );
        payment.setPaymentType(
                PaymentType.SHARED_BOOKING
        );
        payment.setPaymentStatus(
                PaymentStatus.PENDING
        );
        payment.setProof(proofUrl);
        payment.setTransactionDate(
                LocalDateTime.now()
        );

        paymentRepository.saveAndFlush(payment);

        return mapToResponse(participant);
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
    public void confirmSharedTicketPayment(
            UUID participantId,
            boolean isApproved
    ) {
        BookingParticipant participant =
                bookingParticipantRepository
                        .findById(participantId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy thông tin vé"
                                )
                        );

        if (participant.getPaymentProofUrl() == null
                || participant.getPaymentProofUrl().isBlank()) {
            throw new RuntimeException(
                    "Người chơi chưa tải biên lai thanh toán"
            );
        }

        if (participant.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException(
                    "Vé này không ở trạng thái chờ duyệt"
            );
        }

        Booking sourceBooking =
                participant.getBooking();

        if (sourceBooking == null) {
            throw new RuntimeException(
                    "Không tìm thấy booking của vé"
            );
        }

        Booking booking =
                bookingRepository
                        .findByIdForUpdate(
                                sourceBooking.getBookingId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy booking"
                                )
                        );

        if (booking.getBookingType() != BookingType.SHARED) {
            throw new RuntimeException(
                    "Booking này không phải trận vãng lai"
            );
        }

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException(
                    "Kèo vãng lai đã bị hủy"
            );
        }

        if (booking.getStartTime() == null
                || !booking
                .getStartTime()
                .isAfter(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Kèo vãng lai đã bắt đầu hoặc đã kết thúc"
            );
        }

        RentalArea rentalArea =
                booking.getRentalArea();

        User currentUser =
                userService.getCurrentUserEntity();

        if (rentalArea == null
                || rentalArea.getOwner() == null
                || !rentalArea
                .getOwner()
                .getUserId()
                .equals(currentUser.getUserId())) {
            throw new RuntimeException(
                    "Bạn không có quyền duyệt vé của sân này"
            );
        }

        /*
         * Dữ liệu mới: Payment được tạo lúc upload proof.
         * Dữ liệu cũ: nếu proof đã có nhưng chưa có Payment,
         * tự tạo bù Payment để owner vẫn duyệt được.
         */
        Payment payment =
                getOrCreatePendingVietQrPayment(
                        participant,
                        booking,
                        participant.getUser()
                );

        BigDecimal paymentAmount =
                resolveParticipantAmount(
                        participant,
                        booking
                );

        payment.setAmount(paymentAmount);
        payment.setBooking(booking);
        payment.setBookingParticipant(participant);
        payment.setUser(participant.getUser());
        payment.setPaymentMethod(
                PaymentMethod.VIET_QR
        );
        payment.setPaymentType(
                PaymentType.SHARED_BOOKING
        );
        payment.setProof(
                participant.getPaymentProofUrl()
        );

        if (!isApproved) {
            participant.setPaymentStatus(
                    PaymentStatus.FAILED
            );

            payment.setPaymentStatus(
                    PaymentStatus.FAILED
            );

            bookingParticipantRepository
                    .saveAndFlush(participant);

            paymentRepository
                    .saveAndFlush(payment);

            return;
        }

        int currentCount =
                booking.getCurrentParticipants() != null
                        ? booking.getCurrentParticipants()
                        : 0;

        int quantity =
                participant.getQuantity() != null
                        ? participant.getQuantity()
                        : 1;

        int newCount =
                currentCount + quantity;

        if (booking.getMaxParticipants() != null
                && newCount > booking.getMaxParticipants()) {
            throw new RuntimeException(
                    "Số người tham gia vượt quá giới hạn của kèo"
            );
        }

        participant.setAmountPaid(paymentAmount);
        participant.setPaymentStatus(
                PaymentStatus.SUCCESS
        );

        payment.setPaymentStatus(
                PaymentStatus.SUCCESS
        );
        payment.setTransactionDate(
                LocalDateTime.now()
        );

        booking.setCurrentParticipants(
                newCount
        );

        bookingParticipantRepository
                .saveAndFlush(participant);

        paymentRepository
                .saveAndFlush(payment);

        bookingRepository
                .saveAndFlush(booking);

        Transaction transaction =
                Transaction.builder()
                        .type(TransactionType.INCOME)
                        .amount(paymentAmount)
                        .description(
                                "Xác nhận thanh toán vé vãng lai VietQR - "
                                        + participant
                                        .getUser()
                                        .getUserName()
                        )
                        .status(TransactionStatus.SUCCESS)
                        .paymentMethod(PaymentMethod.VIET_QR)
                        .category(
                                TransactionCategory.BOOKING_FULL_PAYMENT
                        )
                        .moneyFlow(
                                MoneyFlow.OWNER_COLLECTED
                        )
                        .rentalArea(rentalArea)
                        .owner(
                                rentalArea.getOwner()
                        )
                        .booking(booking)
                        .transactionDate(
                                LocalDateTime.now()
                        )
                        .referenceId(
                                participant
                                        .getParticipantId()
                                        .toString()
                        )
                        .build();

        transactionRepository.save(transaction);
    }

    @Transactional
    @Override
    public boolean processMinimumParticipants(UUID bookingId) {
        return processMinimumParticipants(bookingId, false);
    }

    @Transactional
    @Override
    public boolean processMinimumParticipants(
            UUID bookingId,
            boolean force
    ) {
        Booking booking =
                bookingRepository
                        .findByIdForUpdate(bookingId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Không tìm thấy booking vãng lai"
                                )
                        );

        if (booking.getBookingType() != BookingType.SHARED) {
            throw new RuntimeException(
                    "Booking này không phải trận vãng lai"
            );
        }

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            return true;
        }

        if (booking.getStartTime() == null) {
            throw new RuntimeException(
                    "Booking chưa có thời gian bắt đầu"
            );
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime checkTime =
                booking.getStartTime().minusMinutes(30);

        if (!force && now.isBefore(checkTime)) {
            return false;
        }

        if (!force && !now.isBefore(booking.getStartTime())) {
            return false;
        }

        if (Boolean.TRUE.equals(
                booking.getMinimumCheckCompleted()
        )) {
            return booking.getBookingStatus()
                    == BookingStatus.CANCELLED;
        }

        int minParticipants =
                booking.getMinParticipants() != null
                        ? booking.getMinParticipants()
                        : 2;

        long confirmedQuantity =
                bookingParticipantRepository
                        .sumQuantityByBookingIdAndStatuses(
                                bookingId,
                                List.of(
                                        PaymentStatus.SUCCESS,
                                        PaymentStatus.BOOKED,
                                        PaymentStatus.COMPLETED
                                )
                        );

        booking.setMinimumCheckCompleted(true);
        booking.setMinimumCheckedAt(now);

        if (confirmedQuantity >= minParticipants) {
            bookingRepository.save(booking);
            return false;
        }

        List<BookingParticipant> participants =
                bookingParticipantRepository
                        .findAllByBooking_BookingId(bookingId);

        for (BookingParticipant participant : participants) {
            PaymentStatus status =
                    participant.getPaymentStatus();

            if (status == PaymentStatus.SUCCESS
                    || status == PaymentStatus.BOOKED
                    || status == PaymentStatus.COMPLETED) {
                participant.setPaymentStatus(
                        PaymentStatus.REFUND_PENDING
                );
            } else if (status == PaymentStatus.PENDING) {
                participant.setPaymentStatus(
                        PaymentStatus.CANCELLED
                );

                participant.setPaymentProofUrl(null);
                participant.setPaymentProofPublicId(null);
                participant.setPaymentProofUploadedAt(null);
            }

            /*
             * CANCELLED_NO_REFUND giữ nguyên:
             * người dùng đã tự hủy trước đó theo chính sách không hoàn.
             */
        }

        bookingParticipantRepository.saveAll(participants);

        List<Payment> sharedPayments =
                paymentRepository
                        .findAllSharedTicketPaymentsByBookingId(
                                bookingId
                        );

        for (Payment payment : sharedPayments) {
            BookingParticipant linkedParticipant =
                    payment.getBookingParticipant();

            if (payment.getPaymentStatus() == PaymentStatus.SUCCESS
                    && linkedParticipant != null
                    && linkedParticipant.getPaymentStatus()
                    == PaymentStatus.REFUND_PENDING) {
                payment.setPaymentStatus(
                        PaymentStatus.REFUND_PENDING
                );
            } else if (payment.getPaymentStatus()
                    == PaymentStatus.PENDING) {
                payment.setPaymentStatus(
                        PaymentStatus.CANCELLED
                );
            }
        }

        paymentRepository.saveAllAndFlush(sharedPayments);

        booking.setBookingStatus(BookingStatus.CANCELLED);
        booking.setCurrentParticipants(0);

        String reason =
                "Hệ thống hủy trận vãng lai do không đủ "
                        + minParticipants
                        + " người tối thiểu. Hiện có "
                        + confirmedQuantity
                        + " người đã thanh toán.";

        String oldNote = booking.getNote();

        booking.setNote(
                oldNote == null || oldNote.isBlank()
                        ? reason
                        : oldNote + "\n" + reason
        );

        if (booking.getSlots() != null) {
            for (Slot slot : booking.getSlots()) {
                slot.setSlotStatus(SlotStatus.AVAILABLE);
                slot.setBooking(null);
            }

            slotRepository.saveAllAndFlush(
                    booking.getSlots()
            );
        }

        bookingRepository.saveAndFlush(booking);
        return true;
    }

    @Transactional
    @Override
    public void cancelSharedTicketBySystem(
            UUID participantId
    ) {
        BookingParticipant participant =
                bookingParticipantRepository
                        .findById(participantId)
                        .orElse(null);

        if (participant == null) {
            return;
        }

        PaymentStatus status =
                participant.getPaymentStatus();

        if (status == PaymentStatus.SUCCESS
                || status == PaymentStatus.BOOKED
                || status == PaymentStatus.COMPLETED
                || status == PaymentStatus.CANCELLED
                || status == PaymentStatus.CANCELLED_NO_REFUND
                || status == PaymentStatus.REFUND_PENDING
                || status == PaymentStatus.REFUND_FAILED
                || status == PaymentStatus.REFUNDED) {
            return;
        }

        participant.setPaymentStatus(
                PaymentStatus.CANCELLED
        );

        participant.setPaymentProofUrl(null);
        participant.setPaymentProofPublicId(null);
        participant.setPaymentProofUploadedAt(null);

        bookingParticipantRepository
                .saveAndFlush(participant);

        cancelPendingPaymentsForParticipant(
                participant
        );
    }

    private BigDecimal resolveParticipantAmount(
            BookingParticipant participant,
            Booking booking
    ) {
        BigDecimal amount =
                participant.getAmountPaid();

        if (amount != null
                && amount.compareTo(BigDecimal.ZERO) > 0) {
            return amount;
        }

        int quantity =
                participant.getQuantity() != null
                        ? participant.getQuantity()
                        : 1;

        BigDecimal pricePerTicket =
                booking.getPricePerTicket();

        if (pricePerTicket == null
                || pricePerTicket.compareTo(
                BigDecimal.ZERO
        ) <= 0) {
            throw new RuntimeException(
                    "Không xác định được số tiền thanh toán vé"
            );
        }

        return pricePerTicket.multiply(
                BigDecimal.valueOf(quantity)
        );
    }

    private Payment getOrCreatePendingVietQrPayment(
            BookingParticipant participant,
            Booking booking,
            User payer
    ) {
        return paymentRepository
                .findTopByBookingParticipantAndPaymentMethodAndPaymentStatusOrderByTransactionDateDesc(
                        participant,
                        PaymentMethod.VIET_QR,
                        PaymentStatus.PENDING
                )
                .orElseGet(() -> {
                    Payment payment =
                            Payment.builder()
                                    .bookingParticipant(
                                            participant
                                    )
                                    .booking(booking)
                                    .user(payer)
                                    .amount(
                                            resolveParticipantAmount(
                                                    participant,
                                                    booking
                                            )
                                    )
                                    .paymentMethod(
                                            PaymentMethod.VIET_QR
                                    )
                                    .paymentType(
                                            PaymentType.SHARED_BOOKING
                                    )
                                    .paymentStatus(
                                            PaymentStatus.PENDING
                                    )
                                    .proof(
                                            participant
                                                    .getPaymentProofUrl()
                                    )
                                    .transactionDate(
                                            LocalDateTime.now()
                                    )
                                    .build();

                    return paymentRepository
                            .saveAndFlush(payment);
                });
    }

    private void cancelPendingPaymentsForParticipant(
            BookingParticipant participant
    ) {
        if (participant.getBooking() == null) {
            return;
        }

        List<Payment> payments =
                paymentRepository
                        .findAllSharedTicketPaymentsByBookingId(
                                participant
                                        .getBooking()
                                        .getBookingId()
                        );

        for (Payment payment : payments) {
            if (payment.getBookingParticipant() == null
                    || !payment
                    .getBookingParticipant()
                    .getParticipantId()
                    .equals(
                            participant.getParticipantId()
                    )) {
                continue;
            }

            if (payment.getPaymentStatus()
                    == PaymentStatus.PENDING) {
                payment.setPaymentStatus(
                        PaymentStatus.CANCELLED
                );
            }
        }

        paymentRepository.saveAll(payments);
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