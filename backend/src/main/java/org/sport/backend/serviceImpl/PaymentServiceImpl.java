package org.sport.backend.serviceImpl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.config.VnPayConfig;
import org.sport.backend.constant.*;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.payment.CheckoutResponse;
import org.sport.backend.entity.*;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.properties.PayOsProperties;
import org.sport.backend.properties.UrlProperties;
import org.sport.backend.repository.*;
import org.sport.backend.service.*;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final BookingService bookingService;
    private final UserService userService;
    private final SharedBookingService sharedBookingService;
    private final CloudinaryService cloudinaryService;

    private final BookingIntentRepository bookingIntentRepository;
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final MatchRegistrationRepository matchRegistrationRepository;
    private final TransactionRepository transactionRepository;
    private final BookingParticipantRepository bookingParticipantRepository;

    private final ObjectMapper objectMapper;
    private final PayOsProperties payOsProperties;
    private final ObjectProvider<PayOS> payOSProvider;
    private final VnPayConfig vnPayConfig;
    private final UrlProperties urlProperties;

    @Override
    public CheckoutResponse checkout(CheckoutRequest checkoutRequest) {
        BookingIntent bookingIntent = bookingIntentRepository.findById(checkoutRequest.getBookingIntentId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        BookingResponse bookingResponse = bookingService.confirmBooking(bookingIntent.getBookingIntentId(), null);
        Booking booking = bookingRepository.findById(bookingResponse.getBookingId()).orElse(null);

        Payment payment = Payment.builder()
                .user(bookingIntent.getUser())
                .booking(booking)
                .amount(bookingIntent.getPreviewPrice())
                .paymentMethod(checkoutRequest.getPaymentMethod())
                .transactionDate(LocalDateTime.now())
                .build();

        if (checkoutRequest.getPaymentMethod() == PaymentMethod.CASH) {
            payment.setPaymentStatus(PaymentStatus.BOOKED);
        } else {
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
        }

        paymentRepository.save(payment);
        return CheckoutResponse.builder()
                .bookingId(bookingResponse.getBookingId())
                .paymentStatus(payment.getPaymentStatus())
                .build();
    }

    @Override
    @Transactional
    public CheckoutResponse checkoutPayment(CheckoutRequest checkoutRequest) {
        BookingIntent intent = bookingIntentRepository
                .findById(checkoutRequest.getBookingIntentId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking intent"));

        User currentUser = userService.getCurrentUserEntity();
        validateIntentOwnership(intent, currentUser);
        validateIntentState(intent);

        PaymentMethod method = checkoutRequest.getPaymentMethod();

        boolean isDeposit = Boolean.TRUE.equals(checkoutRequest.getIsDeposit());
        BigDecimal amountToPay = isDeposit
                ? intent.getPreviewPrice().multiply(new BigDecimal("0.50")).setScale(0, RoundingMode.HALF_UP)
                : intent.getPreviewPrice();
        PaymentType paymentType = isDeposit ? PaymentType.DEPOSIT : PaymentType.FULL;

        log.info("Bắt đầu checkout: Method={}, BookingIntent={}, Amount={}, Type={}",
                method, intent.getBookingIntentId(), amountToPay, paymentType);

        if (method == PaymentMethod.PAY_OS) {
            return handlePayOsCheckout(intent, currentUser, method, amountToPay, paymentType);
        }
        if (method == PaymentMethod.VN_PAY) {
            return handleVnPayCheckout(intent, currentUser, method, amountToPay, paymentType);
        }
        if (method == PaymentMethod.CASH || method == PaymentMethod.PAY_LATER) {
            return handlePayLaterCheckout(intent, currentUser, method, amountToPay, paymentType);
        }
        throw new RuntimeException("Phương thức thanh toán chưa được hỗ trợ: " + method);
    }

    @Override
    @Transactional
    public Map<String, Object> handlePayOsWebhook(Map<String, Object> payload) {
        try {
            WebhookData verifiedData = verifyPayOsWebhook(payload);
            if (verifiedData == null) {
                return Map.of("code", "00", "message", "signature verification failed");
            }
            Map<String, Object> data = objectMapper.convertValue(verifiedData, Map.class);
            String orderCodeValue = data.get("orderCode") == null ? "" : String.valueOf(data.get("orderCode"));
            if (orderCodeValue.isBlank()) {
                return Map.of("code", "00", "message", "orderCode missing");
            }

            long orderCode = Long.parseLong(orderCodeValue);
            Optional<Payment> optionalPayment = paymentRepository.findByOrderCode(orderCode);
            if (optionalPayment.isEmpty()) {
                return Map.of("code", "00", "message", "payment not found");
            }

            Payment payment = optionalPayment.get();

            String payOsTransactionCode =
                    firstNonBlank(
                            data.get("reference"),
                            data.get("transactionCode"),
                            data.get("paymentLinkId")
                    );

            if (payOsTransactionCode != null) {
                payment.setTransactionCode(payOsTransactionCode);
            } else {
                ensureTransactionCode(payment, "PAYOS");
            }

            String code = String.valueOf(payload.getOrDefault("code", ""));
            if ((code == null || code.isBlank()) && data.get("code") != null) {
                code = String.valueOf(data.get("code"));
            }
            if (!"00".equals(code)) {
                if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
                    payment.setPaymentStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                }
                return Map.of("code", "00", "message", "payment failed");
            }

            finalizePaidBookingPayment(payment);
            return Map.of("code", "00", "message", "success");
        } catch (Exception e) {
            log.error("Error processing booking PAYOS webhook", e);
            return Map.of("code", "00", "message", "error");
        }
    }

    @Override
    @Transactional
    public CheckoutResponse handleCheckoutResult(String orderCode, String status) {
        if (orderCode == null || orderCode.isBlank()) {
            throw new RuntimeException("orderCode không hợp lệ");
        }
        Payment payment = paymentRepository.findByOrderCode(Long.parseLong(orderCode))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy payment"));

        if (payment.getBooking() != null && payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return CheckoutResponse.builder()
                    .mode("BOOKED")
                    .paymentStatus(PaymentStatus.SUCCESS)
                    .bookingId(payment.getBooking().getBookingId())
                    .orderCode(orderCode)
                    .message("Đã thanh toán thành công")
                    .build();
        }

        if (isSuccessStatus(status) && payment.getPaymentStatus() == PaymentStatus.PENDING) {
            if (tryFinalizeByPayOsPaymentStatus(payment)) {
                return CheckoutResponse.builder()
                        .mode("BOOKED")
                        .paymentStatus(PaymentStatus.SUCCESS)
                        .bookingId(payment.getBooking().getBookingId())
                        .orderCode(orderCode)
                        .message("Thanh toán thành công")
                        .build();
            }
            return CheckoutResponse.builder()
                    .mode("PENDING")
                    .paymentStatus(PaymentStatus.PENDING)
                    .orderCode(orderCode)
                    .message("Đang chờ webhook xác nhận thanh toán")
                    .build();
        }

        if (isFailureStatus(status) && payment.getPaymentStatus() == PaymentStatus.PENDING) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);

            if (payment.getPaymentType() == PaymentType.SHARED_BOOKING && payment.getBookingParticipant() != null) {
                sharedBookingService.cancelSharedTicketBySystem(payment.getBookingParticipant().getParticipantId());
            }
        }

        return CheckoutResponse.builder()
                .mode("FAILED")
                .paymentStatus(payment.getPaymentStatus())
                .orderCode(orderCode)
                .message("Thanh toán chưa thành công")
                .build();
    }

    @Override
    @Transactional
    public CheckoutResponse handleVnPayReturn(Map<String, String> fields) {
        boolean isValidSignature = vnPayConfig.verifySignature(fields);
        if (!isValidSignature) {
            throw new RuntimeException("Chữ ký VNPay không hợp lệ hoặc dữ liệu bị can thiệp");
        }

        String vnp_ResponseCode = fields.get("vnp_ResponseCode");
        String vnp_TxnRef = fields.get("vnp_TxnRef");

        if (vnp_TxnRef == null || vnp_TxnRef.isBlank()) {
            throw new RuntimeException("Không tìm thấy mã giao dịch (vnp_TxnRef)");
        }

        long orderCode = Long.parseLong(vnp_TxnRef);
        Payment payment = paymentRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch với orderCode: " + orderCode));

        String vnpTransactionNo =
                fields.get("vnp_TransactionNo");

        if (vnpTransactionNo != null
                && !vnpTransactionNo.isBlank()) {
            payment.setTransactionCode(
                    vnpTransactionNo.trim()
            );
        } else {
            ensureTransactionCode(
                    payment,
                    "VNPAY"
            );
        }

        if ("00".equals(vnp_ResponseCode)) {
            if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
                finalizePaidBookingPayment(payment);
            }
            return CheckoutResponse.builder()
                    .mode("BOOKED")
                    .paymentStatus(PaymentStatus.SUCCESS)
                    .bookingId(payment.getBooking() != null ? payment.getBooking().getBookingId() : null)
                    .orderCode(String.valueOf(orderCode))
                    .message("Thanh toán VNPay thành công")
                    .build();
        } else {
            if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
                payment.setPaymentStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);

                if (payment.getPaymentType() == PaymentType.SHARED_BOOKING && payment.getBookingParticipant() != null) {
                    sharedBookingService.cancelSharedTicketBySystem(payment.getBookingParticipant().getParticipantId());
                }
            }
            return CheckoutResponse.builder()
                    .mode("FAILED")
                    .paymentStatus(PaymentStatus.FAILED)
                    .orderCode(String.valueOf(orderCode))
                    .message("Thanh toán VNPay không thành công (Mã lỗi: " + vnp_ResponseCode + ")")
                    .build();
        }
    }

    @Transactional
    @Override
    public CheckoutResponse checkoutSharedTicket(UUID participantId, PaymentMethod method) {
        User currentUser = userService.getCurrentUserEntity();
        BookingParticipant participant = bookingParticipantRepository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin vé"));

        if (participant.getUser() == null || !participant.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Bạn không có quyền thanh toán vé này");
        }

        PaymentStatus participantStatus = participant.getPaymentStatus();

        if (participantStatus == PaymentStatus.SUCCESS
                || participantStatus == PaymentStatus.BOOKED
                || participantStatus == PaymentStatus.COMPLETED) {
            throw new RuntimeException("Vé này đã được thanh toán");
        }

        if (participantStatus == PaymentStatus.CANCELLED
                || participantStatus == PaymentStatus.CANCELLED_NO_REFUND
                || participantStatus == PaymentStatus.REFUND_PENDING
                || participantStatus == PaymentStatus.REFUND_FAILED
                || participantStatus == PaymentStatus.REFUNDED
                || participantStatus == PaymentStatus.FAILED) {
            throw new RuntimeException(
                    "Vé này đã kết thúc. Vui lòng đăng ký một lượt tham gia mới"
            );
        }

        Booking booking = participant.getBooking();
        if (booking == null || booking.getBookingType() != BookingType.SHARED) {
            throw new RuntimeException("Booking không phải đặt vãng lai");
        }

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Kèo vãng lai đã bị hủy");
        }

        if (booking.getStartTime() == null
                || !booking.getStartTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Sân vãng lai đã diễn ra");
        }

        BigDecimal amount = participant.getAmountPaid();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            amount = booking.getPricePerTicket();
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Không tìm thấy giá vé hợp lệ");
        }

        long orderCode = generateUniqueOrderCode();
        Payment payment = Payment.builder()
                .booking(booking)
                .bookingParticipant(participant)
                .user(currentUser)
                .amount(amount)
                .paymentMethod(method)
                .paymentType(PaymentType.SHARED_BOOKING)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now())
                .orderCode(orderCode)
                .build();

        ensureTransactionCode(
                payment,
                method == PaymentMethod.VIET_QR
                        ? "VQR"
                        : method.name()
        );

        paymentRepository.save(payment);

        if (method == PaymentMethod.PAY_OS) {
            return handlePayOsSharedTicket(payment, participant);
        }
        if (method == PaymentMethod.VN_PAY) {
            return handleVnPaySharedTicket(payment, participant);
        }
        if (method == PaymentMethod.VIET_QR) {
            return CheckoutResponse.builder()
                    .mode("UPLOAD_PROOF")
                    .paymentStatus(PaymentStatus.PENDING)
                    .orderCode(String.valueOf(orderCode))
                    .message("Vui lòng chuyển khoản và tải ảnh biên lai")
                    .build();
        }
        throw new RuntimeException("Phương thức thanh toán vé chưa được hỗ trợ");
    }

    @Override
    @Transactional
    public CheckoutResponse checkoutMatchJoin(UUID registrationId, PaymentMethod method) {
        MatchRegistration reg = matchRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin đăng ký trận đấu"));

        if (reg.getIsPaid() != null && reg.getIsPaid()) {
            throw new RuntimeException("Bạn đã thanh toán phí ghép trận này rồi");
        }

        List<Payment> pendingPayments = paymentRepository.findAllByMatchRegistration(reg).stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING)
                .collect(Collectors.toList());

        if (method == PaymentMethod.VIET_QR) {
            Optional<Payment> existingVietQr = pendingPayments.stream()
                    .filter(p -> p.getPaymentMethod() == PaymentMethod.VIET_QR)
                    .max(java.util.Comparator.comparing(Payment::getTransactionDate));

            if (existingVietQr.isPresent()) {
                return handleVietQrMatchJoin(existingVietQr.get(), reg);
            }
        }

        for (Payment oldPayment : pendingPayments) {
            oldPayment.setPaymentStatus(PaymentStatus.CANCELLED);
        }
        paymentRepository.saveAll(pendingPayments);

        long orderCode = generateUniqueOrderCode();
        Payment payment = Payment.builder()
                .matchRegistration(reg)
                .user(reg.getUser())
                .amount(reg.getAmountDue())
                .paymentMethod(method)
                .paymentType(PaymentType.MATCH_JOIN)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now())
                .orderCode(orderCode)
                .build();

        ensureTransactionCode(
                payment,
                method == PaymentMethod.VIET_QR
                        ? "VQR"
                        : method.name()
        );

        paymentRepository.save(payment);

        if (method == PaymentMethod.VN_PAY) return handleVnPayMatchJoin(payment, reg);
        if (method == PaymentMethod.PAY_OS) return handlePayOsMatchJoin(payment, reg);
        if (method == PaymentMethod.VIET_QR) return handleVietQrMatchJoin(payment, reg);

        throw new RuntimeException("Phương thức thanh toán chưa được hỗ trợ cho ghép trận: " + method);
    }

    @Transactional
    @Override
    public void uploadMatchPaymentProof(UUID registrationId, MultipartFile file) {
        MatchRegistration reg = matchRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin đăng ký trận đấu"));

        Payment payment = paymentRepository.findAllByMatchRegistration(reg).stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING)
                .filter(p -> p.getPaymentMethod() == PaymentMethod.VIET_QR)
                .max(java.util.Comparator.comparing(Payment::getTransactionDate))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch VietQR chờ thanh toán hợp lệ"));

        try {
            CloudinaryUploadResult uploadResult = cloudinaryService.uploadImage(file, "payment_proofs");
            payment.setProof(uploadResult.getUrl());
            paymentRepository.save(payment);
            log.info("Đã nhận ảnh chứng từ VietQR ghép kèo. RegID: {}, URL: {}", registrationId, uploadResult.getUrl());
        } catch (Exception e) {
            log.error("Lỗi khi upload ảnh chứng từ ghép kèo: ", e);
            throw new RuntimeException("Không thể tải ảnh chứng từ lên hệ thống", e);
        }
    }

    @Override
    public List<Map<String, Object>> getMatchPaymentsForOwner(String status, String keyword, String startDateStr, String endDateStr) {
        User owner = userService.getCurrentUserEntity();
        LocalDate startDate = (startDateStr != null && !startDateStr.isBlank()) ? LocalDate.parse(startDateStr) : null;
        LocalDate endDate = (endDateStr != null && !endDateStr.isBlank()) ? LocalDate.parse(endDateStr) : null;
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";

        return paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentType() == PaymentType.MATCH_JOIN)
                .filter(p -> p.getPaymentMethod() == PaymentMethod.VIET_QR)
                .filter(p -> p.getProof() != null && !p.getProof().isEmpty())
                .filter(p -> {
                    if (p.getMatchRegistration() != null && p.getMatchRegistration().getMatch() != null) {
                        RentalArea area = p.getMatchRegistration().getMatch().getCourt().getRentalArea();
                        return area != null && area.getOwner().getUserId().equals(owner.getUserId());
                    }
                    return false;
                })
                .filter(p -> {
                    if ("PENDING".equalsIgnoreCase(status)) return p.getPaymentStatus() == PaymentStatus.PENDING;
                    if ("PROCESSED".equalsIgnoreCase(status))
                        return p.getPaymentStatus() == PaymentStatus.SUCCESS || p.getPaymentStatus() == PaymentStatus.FAILED;
                    return true;
                })
                .filter(p -> {
                    if (startDate != null && p.getTransactionDate().toLocalDate().isBefore(startDate)) return false;
                    return endDate == null || !p.getTransactionDate().toLocalDate().isAfter(endDate);
                })
                .filter(p -> {
                    if (kw.isEmpty()) return true;
                    String name = p.getUser().getUserName() != null ? p.getUser().getUserName().toLowerCase() : "";
                    String phone = p.getUser().getPhone() != null ? p.getUser().getPhone().toLowerCase() : "";
                    String room = p.getMatchRegistration().getMatch().getRoomCode() != null ? p.getMatchRegistration().getMatch().getRoomCode().toLowerCase() : "";
                    return name.contains(kw) || phone.contains(kw) || room.contains(kw);
                })
                .sorted((p1, p2) -> p2.getTransactionDate().compareTo(p1.getTransactionDate()))
                .map(p -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("paymentId", p.getPaymentId());
                    map.put("amount", p.getAmount());
                    map.put("transactionDate", p.getTransactionDate());
                    map.put("proof", p.getProof());
                    map.put("userName", p.getUser().getUserName());
                    map.put("phone", p.getUser().getPhone());
                    map.put("roomCode", p.getMatchRegistration().getMatch().getRoomCode());
                    map.put("status", p.getPaymentStatus().name());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void confirmMatchPayment(UUID paymentId, boolean isApproved) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        if (payment.getPaymentType() != PaymentType.MATCH_JOIN || payment.getPaymentMethod() != PaymentMethod.VIET_QR) {
            throw new RuntimeException("Owner chỉ được duyệt thanh toán VietQR cho ghép trận");
        }
        if (payment.getProof() == null || payment.getProof().isBlank()) {
            throw new RuntimeException("Chưa có ảnh chuyển khoản");
        }
        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Giao dịch không ở trạng thái chờ duyệt");
        }

        if (isApproved) {
            ensureTransactionCode(
                    payment,
                    "VQR"
            );
            finalizePaidBookingPayment(payment);
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
    }

    private CheckoutResponse handleVnPayCheckout(BookingIntent intent, User user, PaymentMethod method, BigDecimal amountToPay, PaymentType paymentType) {
        long orderCode = generateUniqueOrderCode();
        Payment payment = Payment.builder()
                .bookingIntent(intent).amount(amountToPay).paymentMethod(method)
                .paymentType(paymentType).paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now()).user(user).orderCode(orderCode).build();
        paymentRepository.save(payment);

        try {
            String description = "Thanh toan booking " + intent.getBookingIntentId().toString().substring(0, 8);
            String paymentUrl = vnPayConfig.createPaymentUrl(orderCode, amountToPay.longValue(), description);
            return CheckoutResponse.builder()
                    .mode("REDIRECT").paymentStatus(PaymentStatus.PENDING)
                    .paymentUrl(paymentUrl).orderCode(String.valueOf(orderCode))
                    .message("Tạo link thanh toán VNPay thành công").build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Không thể tạo link thanh toán VNPay", e);
        }
    }

    private CheckoutResponse handlePayLaterCheckout(BookingIntent intent, User user, PaymentMethod method, BigDecimal amountToPay, PaymentType paymentType) {
        long orderCode = generateUniqueOrderCode();
        Payment payment = Payment.builder()
                .bookingIntent(intent).amount(amountToPay).paymentMethod(method)
                .paymentType(paymentType).paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now()).user(user).orderCode(orderCode).build();
        paymentRepository.save(payment);

        finalizeUnpaidBooking(payment);

        return CheckoutResponse.builder()
                .mode("BOOKED").paymentStatus(PaymentStatus.PENDING)
                .bookingId(payment.getBooking().getBookingId()).orderCode(String.valueOf(orderCode))
                .message("Đặt sân thành công, vui lòng thanh toán tại sân").build();
    }

    private void finalizeUnpaidBooking(Payment payment) {
        try {
            BookingIntent intent = payment.getBookingIntent();
            BookingResponse bookingResponse = bookingService.confirmBooking(intent.getBookingIntentId(), payment);

            intent.setStatus(BookingIntentStatus.CONFIRMED);
            bookingIntentRepository.save(intent);

            Booking booking = bookingRepository.findById(bookingResponse.getBookingId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy booking vừa tạo"));

            BigDecimal totalPrice = intent.getPreviewPrice();
            booking.setTotalPrice(totalPrice);
            booking.setDepositAmount(BigDecimal.ZERO);
            booking.setRemainingAmount(totalPrice);

            bookingRepository.save(booking);

            payment.setBooking(booking);
            paymentRepository.save(payment);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xác nhận đặt sân thanh toán tại chỗ", e);
        }
    }

    private void finalizePaidSharedTicket(Payment payment) {
        BookingParticipant participant =
                payment.getBookingParticipant();

        if (participant == null) {
            throw new RuntimeException(
                    "Không tìm thấy thông tin người tham gia"
            );
        }

        if (participant.getPaymentStatus() == PaymentStatus.SUCCESS) {
            if (payment.getPaymentStatus() != PaymentStatus.SUCCESS) {
                payment.setPaymentStatus(PaymentStatus.SUCCESS);
                paymentRepository.save(payment);
            }
            return;
        }

        PaymentStatus currentStatus = participant.getPaymentStatus();

        if (currentStatus == PaymentStatus.CANCELLED
                || currentStatus == PaymentStatus.CANCELLED_NO_REFUND
                || currentStatus == PaymentStatus.REFUND_PENDING
                || currentStatus == PaymentStatus.REFUND_FAILED
                || currentStatus == PaymentStatus.REFUNDED
                || currentStatus == PaymentStatus.FAILED) {
            throw new RuntimeException(
                    "Vé này không còn hợp lệ để thanh toán"
            );
        }

        Booking sourceBooking = participant.getBooking();

        if (sourceBooking == null) {
            throw new RuntimeException(
                    "Không tìm thấy booking vãng lai"
            );
        }

        Booking booking = bookingRepository
                .findByIdForUpdate(sourceBooking.getBookingId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy booking vãng lai"
                        )
                );

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException(
                    "Kèo vãng lai đã bị hủy"
            );
        }

        int quantity =
                participant.getQuantity() != null
                        ? participant.getQuantity()
                        : 1;

        BigDecimal paidAmount =
                payment.getAmount() != null
                        ? payment.getAmount()
                        : participant.getAmountPaid();

        if (paidAmount == null
                || paidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException(
                    "Số tiền thanh toán vé không hợp lệ"
            );
        }

        participant.setAmountPaid(paidAmount);
        participant.setPaymentStatus(PaymentStatus.SUCCESS);
        bookingParticipantRepository.saveAndFlush(participant);

        int currentParticipants =
                booking.getCurrentParticipants() != null
                        ? booking.getCurrentParticipants()
                        : 0;

        int newParticipantCount = currentParticipants + quantity;

        if (booking.getMaxParticipants() != null
                && newParticipantCount > booking.getMaxParticipants()) {
            throw new RuntimeException(
                    "Số người tham gia vượt quá giới hạn của kèo"
            );
        }

        booking.setCurrentParticipants(newParticipantCount);
        bookingRepository.saveAndFlush(booking);

        payment.setBooking(booking);
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        paymentRepository.saveAndFlush(payment);

        RentalArea rentalArea = booking.getRentalArea();
        User owner =
                rentalArea != null
                        ? rentalArea.getOwner()
                        : null;

        if (rentalArea == null || owner == null) {
            log.warn(
                    "Booking vãng lai {} chưa có rentalArea hoặc owner",
                    booking.getBookingId()
            );
            return;
        }

        String userName =
                payment.getUser() != null
                        && payment.getUser().getUserName() != null
                        ? payment.getUser().getUserName()
                        : "Khách vãng lai";

        MoneyFlow moneyFlow =
                payment.getPaymentMethod() == PaymentMethod.VIET_QR
                        ? MoneyFlow.OWNER_COLLECTED
                        : MoneyFlow.ADMIN_COLLECTED;

        Transaction transaction =
                Transaction.builder()
                        .type(TransactionType.INCOME)
                        .amount(paidAmount)
                        .description(
                                "Thu tiền vé vãng lai "
                                        + booking.getBookingId()
                                        .toString()
                                        .substring(0, 8)
                                        + " - "
                                        + userName
                        )
                        .status(TransactionStatus.SUCCESS)
                        .paymentMethod(payment.getPaymentMethod())
                        .category(
                                TransactionCategory.BOOKING_FULL_PAYMENT
                        )
                        .moneyFlow(moneyFlow)
                        .rentalArea(rentalArea)
                        .owner(owner)
                        .booking(booking)
                        .transactionDate(LocalDateTime.now())
                        .referenceId(
                                participant.getParticipantId().toString()
                        )
                        .build();

        transactionRepository.save(transaction);
    }

    private void finalizePaidBookingPayment(Payment payment) {
        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) return;

        if (payment.getPaymentType() == PaymentType.SHARED_BOOKING) {
            finalizePaidSharedTicket(payment);
            return;
        }

        if (payment.getPaymentType() == PaymentType.MATCH_JOIN) {
            try {
                MatchRegistration reg = payment.getMatchRegistration();
                if (reg != null) {
                    reg.setIsPaid(true);
                    matchRegistrationRepository.save(reg);

                    Court court = reg.getMatch().getCourt();
                    RentalArea rentalArea = (court != null) ? court.getRentalArea() : null;
                    User owner = (rentalArea != null) ? rentalArea.getOwner() : null;

                    if (rentalArea != null && owner != null) {
                        String userName = (payment.getUser() != null) ? payment.getUser().getUserName() : "Người chơi";
                        String roomCode = reg.getMatch().getRoomCode();

                        Transaction transaction = Transaction.builder()
                                .type(TransactionType.INCOME)
                                .amount(payment.getAmount())
                                .description("Thu phí ghép trận phòng " + roomCode + " - " + userName)
                                .status(TransactionStatus.SUCCESS)
                                .paymentMethod(payment.getPaymentMethod())
                                .category(TransactionCategory.MATCH_JOIN_PAYMENT)
                                .moneyFlow(payment.getPaymentMethod() == PaymentMethod.VIET_QR ? MoneyFlow.OWNER_COLLECTED : MoneyFlow.ADMIN_COLLECTED)
                                .rentalArea(rentalArea)
                                .owner(owner)
                                .transactionDate(LocalDateTime.now())
                                .referenceId(payment.getPaymentId().toString())
                                .build();
                        transactionRepository.save(transaction);
                    }

                    payment.setPaymentStatus(PaymentStatus.SUCCESS);
                    paymentRepository.saveAndFlush(payment);

                    List<Payment> oldPendingPayments = paymentRepository.findAllByMatchRegistration(reg).stream()
                            .filter(p -> !p.getPaymentId().equals(payment.getPaymentId()))
                            .filter(p -> p.getPaymentStatus() == PaymentStatus.PENDING)
                            .collect(Collectors.toList());

                    for (Payment oldPayment : oldPendingPayments) {
                        oldPayment.setPaymentStatus(PaymentStatus.CANCELLED);
                    }
                    paymentRepository.saveAll(oldPendingPayments);

                    Booking cachedBooking = reg.getMatch().getBooking();
                    if (cachedBooking != null) {
                        Booking matchBooking = bookingRepository.findById(cachedBooking.getBookingId()).orElse(null);
                        if (matchBooking != null) {
                            BigDecimal totalPaidForMatch = paymentRepository.sumPaidAmountForMatch(reg.getMatch().getMatchId());
                            matchBooking.setDepositAmount(totalPaidForMatch);
                            BigDecimal totalPrice = matchBooking.getTotalPrice() != null ? matchBooking.getTotalPrice() : BigDecimal.ZERO;
                            BigDecimal remaining = totalPrice.subtract(totalPaidForMatch);

                            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                                remaining = BigDecimal.ZERO;
                                if (matchBooking.getBookingStatus() == BookingStatus.PENDING) {
                                    matchBooking.setBookingStatus(BookingStatus.BOOKED);
                                }
                            }
                            matchBooking.setRemainingAmount(remaining);
                            bookingRepository.save(matchBooking);
                        }
                    }
                }
                return;
            } catch (Exception e) {
                log.error("Lỗi chí mạng khi cập nhật thanh toán ghép trận: ", e);
                throw new RuntimeException("Lỗi xử lý ghép trận: " + e.getMessage(), e);
            }
        }

        if (payment.getBookingIntent() != null && payment.getBookingIntent().getStatus() == BookingIntentStatus.CONFIRMED && payment.getBooking() != null) {
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(payment);
            return;
        }

        try {
            BookingIntent intent = payment.getBookingIntent();
            if (intent == null) throw new RuntimeException("Không tìm thấy Booking Intent");

            BookingResponse bookingResponse = bookingService.confirmBooking(intent.getBookingIntentId(), payment);
            intent.setStatus(BookingIntentStatus.CONFIRMED);
            bookingIntentRepository.save(intent);

            Booking booking = bookingRepository.findById(bookingResponse.getBookingId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy booking vừa tạo"));

            BigDecimal totalPrice = intent.getPreviewPrice();
            BigDecimal paidAmount = payment.getAmount();
            BigDecimal remainingAmount = totalPrice.subtract(paidAmount);

            booking.setTotalPrice(totalPrice);
            booking.setDepositAmount(paidAmount);
            booking.setRemainingAmount(remainingAmount);
            bookingRepository.save(booking);

            try {
                String invoiceViewUrl = buildInvoiceViewUrl(booking.getBookingId());
                booking.setInvoiceUrl(invoiceViewUrl);
                bookingRepository.save(booking);
            } catch (Exception e) {
                log.warn("Cannot build invoice view URL for booking {}", booking.getBookingId(), e);
            }

            payment.setBooking(booking);
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(payment);

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi xử lý xác nhận thanh toán: " + e.getMessage(), e);
        }
    }

    private CheckoutResponse handlePayOsCheckout(BookingIntent intent, User user, PaymentMethod method, BigDecimal amountToPay, PaymentType paymentType) {
        PayOS payOS = requirePayOsClient();
        long orderCode = generateUniqueOrderCode();

        Payment payment = Payment.builder()
                .bookingIntent(intent).amount(amountToPay).paymentMethod(method)
                .paymentType(paymentType).paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now()).user(user).orderCode(orderCode).build();
        paymentRepository.save(payment);

        try {
            long amount = amountToPay.longValue();
            String itemName = paymentType == PaymentType.DEPOSIT ? "Dat coc booking" : "Thanh toan full booking";
            PaymentLinkItem item = PaymentLinkItem.builder().name(itemName).quantity(1).price(amount).build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode).amount(amount).description("Booking " + intent.getBookingIntentId().toString().substring(0, 8))
                    .item(item).returnUrl(buildBookingReturnUrl(orderCode, "success")).cancelUrl(buildBookingReturnUrl(orderCode, "cancel")).build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            payment.setPayosPaymentLinkId(response.getPaymentLinkId());
            paymentRepository.save(payment);

            return CheckoutResponse.builder()
                    .mode("REDIRECT").paymentStatus(PaymentStatus.PENDING).paymentUrl(response.getCheckoutUrl())
                    .orderCode(String.valueOf(orderCode)).message("Tạo link thanh toán thành công").build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            log.error("Lỗi tạo link PayOS: ", e);
            throw new RuntimeException("Không thể tạo link thanh toán PAYOS");
        }
    }

    private CheckoutResponse handlePayOsSharedTicket(Payment payment, BookingParticipant participant) {
        PayOS payOS = requirePayOsClient();
        try {
            long amount = payment.getAmount().longValue();
            PaymentLinkItem item = PaymentLinkItem.builder().name("Ve xe san LaceUp").quantity(1).price(amount).build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(payment.getOrderCode()).amount(amount)
                    .description("Ve " + participant.getParticipantId().toString().substring(0, 8))
                    .item(item).returnUrl(buildTicketReturnUrl(payment.getOrderCode(), "success"))
                    .cancelUrl(buildTicketReturnUrl(payment.getOrderCode(), "cancel")).build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            payment.setPayosPaymentLinkId(response.getPaymentLinkId());
            paymentRepository.save(payment);

            return CheckoutResponse.builder()
                    .mode("REDIRECT").paymentStatus(PaymentStatus.PENDING).paymentUrl(response.getCheckoutUrl())
                    .orderCode(String.valueOf(payment.getOrderCode())).message("Tạo link thanh toán vé thành công").build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Không thể tạo link PayOS cho vé", e);
        }
    }

    private CheckoutResponse handleVnPaySharedTicket(Payment payment, BookingParticipant participant) {
        try {
            String description = "Thanh toan ve " + participant.getParticipantId().toString().substring(0, 8);
            String paymentUrl = vnPayConfig.createPaymentUrl(payment.getOrderCode(), payment.getAmount().longValue(), description);

            return CheckoutResponse.builder()
                    .mode("REDIRECT").paymentStatus(PaymentStatus.PENDING).paymentUrl(paymentUrl)
                    .orderCode(String.valueOf(payment.getOrderCode())).message("Tạo link VNPay cho vé thành công").build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Không thể tạo link VNPay cho vé", e);
        }
    }

    private CheckoutResponse handleVnPayMatchJoin(Payment payment, MatchRegistration reg) {
        try {
            String description = "Thanh toan phi ghep tran " + reg.getMatch().getRoomCode();
            String paymentUrl = vnPayConfig.createPaymentUrl(payment.getOrderCode(), payment.getAmount().longValue(), description);
            return CheckoutResponse.builder()
                    .mode("REDIRECT").paymentStatus(PaymentStatus.PENDING).paymentUrl(paymentUrl)
                    .orderCode(String.valueOf(payment.getOrderCode())).message("Tạo link thanh toán VNPay thành công").build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Không thể tạo link thanh toán VNPay", e);
        }
    }

    private CheckoutResponse handlePayOsMatchJoin(Payment payment, MatchRegistration reg) {
        PayOS payOS = requirePayOsClient();
        try {
            long amount = payment.getAmount().longValue();
            PaymentLinkItem item = PaymentLinkItem.builder().name("Phi ghep tran " + reg.getMatch().getRoomCode()).quantity(1).price(amount).build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(payment.getOrderCode()).amount(amount).description("Match " + reg.getMatch().getRoomCode())
                    .item(item).returnUrl(buildBookingReturnUrl(payment.getOrderCode(), "success")).cancelUrl(buildBookingReturnUrl(payment.getOrderCode(), "cancel")).build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            payment.setPayosPaymentLinkId(response.getPaymentLinkId());
            paymentRepository.save(payment);

            return CheckoutResponse.builder()
                    .mode("REDIRECT").paymentStatus(PaymentStatus.PENDING).paymentUrl(response.getCheckoutUrl())
                    .orderCode(String.valueOf(payment.getOrderCode())).message("Tạo link thanh toán PayOS thành công").build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            log.error("Lỗi tạo link PayOS cho Match Join: ", e);
            throw new RuntimeException("Không thể tạo link thanh toán PAYOS cho ghép trận");
        }
    }

    private CheckoutResponse handleVietQrMatchJoin(Payment payment, MatchRegistration reg) {
        try {
            Match match = reg.getMatch();
            if (match == null || match.getCourt() == null || match.getCourt().getRentalArea() == null) {
                throw new RuntimeException("Không tìm thấy thông tin sân của trận đấu");
            }
            RentalArea rentalArea = match.getCourt().getRentalArea();
            User owner = rentalArea.getOwner();
            if (owner == null || owner.getBankAccount() == null) {
                throw new RuntimeException("Owner chưa cấu hình tài khoản ngân hàng để nhận thanh toán.");
            }
            BankAccount bank = owner.getBankAccount();
            String bankNameStr = bank.getBankName() != null ? bank.getBankName().trim() : "";
            String accNumStr = bank.getAccountNumber() != null ? bank.getAccountNumber().trim() : "";
            String accNameStr = bank.getAccountHolderName() != null ? bank.getAccountHolderName().trim() : "";

            if (bankNameStr.isBlank() || accNumStr.isBlank() || accNameStr.isBlank()) {
                throw new RuntimeException("Thông tin tài khoản ngân hàng của owner chưa đầy đủ");
            }
            long amount = payment.getAmount().longValue();
            String transferContent = "LACEUP MATCH " + match.getMatchId().toString().substring(0, 8).toUpperCase();
            String encodedInfo = java.net.URLEncoder.encode(transferContent, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
            String encodedName = java.net.URLEncoder.encode(accNameStr, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");

            String vietQrUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                    bankNameStr, accNumStr, amount, encodedInfo, encodedName);

            payment.setPaymentStatus(PaymentStatus.PENDING);
            paymentRepository.save(payment);

            return CheckoutResponse.builder()
                    .mode("PENDING").paymentStatus(PaymentStatus.PENDING).orderCode(String.valueOf(payment.getOrderCode()))
                    .message("Tạo mã VietQR thành công").bankName(bankNameStr).accountNumber(accNumStr)
                    .accountName(accNameStr).transferContent(transferContent).vietQrUrl(vietQrUrl).build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Không thể tạo mã VietQR cho ghép trận: " + e.getMessage(), e);
        }
    }

    private boolean tryFinalizeByPayOsPaymentStatus(Payment payment) {
        PayOS payOS = requirePayOsClient();
        if (payment.getOrderCode() == null) return false;
        try {
            Object linkData = payOS.paymentRequests().get(payment.getOrderCode());
            Map<String, Object> data = objectMapper.convertValue(linkData, Map.class);
            String status = String.valueOf(data.getOrDefault("status", ""));
            if (!"PAID".equalsIgnoreCase(status)) return false;

            String payOsTransactionCode =
                    firstNonBlank(
                            data.get("reference"),
                            data.get("transactionCode"),
                            data.get("paymentLinkId")
                    );

            if (payOsTransactionCode != null) {
                payment.setTransactionCode(payOsTransactionCode);
            } else {
                ensureTransactionCode(payment, "PAYOS");
            }

            finalizePaidBookingPayment(payment);
            return true;
        } catch (Exception e) {
            log.warn("Cannot verify PAYOS payment status from result page. orderCode={}", payment.getOrderCode(), e);
            return false;
        }
    }

    private void validateIntentOwnership(BookingIntent intent, User currentUser) {
        if (intent.getUser() == null || !intent.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Bạn không có quyền thanh toán booking intent này");
        }
    }

    private void validateIntentState(BookingIntent intent) {
        if (intent.getExpiresAt() != null && intent.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Booking intent đã hết hạn");
        }
        if (intent.getStatus() == BookingIntentStatus.CONFIRMED) {
            throw new RuntimeException("Booking intent này đã được thanh toán");
        }
        if (intent.getStatus() == BookingIntentStatus.CANCELLED || intent.getStatus() == BookingIntentStatus.EXPIRED) {
            throw new RuntimeException("Booking intent không còn hợp lệ để thanh toán");
        }
    }

    private PayOS requirePayOsClient() {
        if (payOsProperties.getClientId() == null || payOsProperties.getClientId().isBlank()
                || payOsProperties.getApiKey() == null || payOsProperties.getApiKey().isBlank()
                || payOsProperties.getChecksumKey() == null || payOsProperties.getChecksumKey().isBlank()) {
            throw new RuntimeException("PAYOS chưa được cấu hình đầy đủ");
        }
        PayOS payOS = payOSProvider.getIfAvailable();
        if (payOS == null) throw new RuntimeException("Không khởi tạo được PAYOS client");
        return payOS;
    }

    private WebhookData verifyPayOsWebhook(Map<String, Object> payload) {
        PayOS payOS = payOSProvider.getIfAvailable();
        if (payOS == null) return null;
        try {
            return payOS.webhooks().verify(payload);
        } catch (Exception e) {
            log.error("Error verifying booking PAYOS webhook signature", e);
            return null;
        }
    }

    private long generateUniqueOrderCode() {
        long orderCode = System.currentTimeMillis() / 1000;
        int attempts = 0;
        while (paymentRepository.findByOrderCode(orderCode).isPresent()) {
            orderCode++;
            attempts++;
            if (attempts > 10_000) throw new RuntimeException("Không thể sinh orderCode duy nhất cho PAYOS");
        }
        return orderCode;
    }

    private String buildTicketReturnUrl(long orderCode, String status) {
        return urlProperties.getFrontend() + "/payment/ticket-result?orderCode=" + orderCode + "&status=" + status;
    }

    private String buildBookingReturnUrl(long orderCode, String status) {
        String fallback = urlProperties.getFrontend() + "/payment/booking-result";
        String base = payOsProperties.getReturnUrl();
        if ("cancel".equalsIgnoreCase(status)) base = payOsProperties.getCancelUrl();
        if (base == null || base.isBlank()) return fallback + "?orderCode=" + orderCode + "&status=" + status;
        try {
            URI source = URI.create(base);
            return source.getScheme() + "://" + source.getAuthority() + "/payment/booking-result?orderCode=" + orderCode + "&status=" + status;
        } catch (Exception e) {
            return fallback + "?orderCode=" + orderCode + "&status=" + status;
        }
    }

    private String buildInvoiceViewUrl(UUID bookingId) {
        String fallback = urlProperties.getBackend() + "/bookings/" + bookingId + "/invoice/view";
        String base = payOsProperties.getReturnUrl();
        if (base == null || base.isBlank()) return fallback;
        try {
            URI source = URI.create(base);
            return source.getScheme() + "://" + source.getAuthority() + "/bookings/" + bookingId + "/invoice/view";
        } catch (Exception e) {
            return fallback;
        }
    }

    private boolean isSuccessStatus(String status) {
        if (status == null) return false;
        String normalized = status.trim().toLowerCase();
        return "success".equals(normalized) || "paid".equals(normalized) || "succeeded".equals(normalized);
    }

    private boolean isFailureStatus(String status) {
        if (status == null) return false;
        String normalized = status.trim().toLowerCase();
        return "cancel".equals(normalized) || "cancelled".equals(normalized) || "canceled".equals(normalized) || "failed".equals(normalized) || "fail".equals(normalized);
    }


    private void ensureTransactionCode(
            Payment payment,
            String prefix
    ) {
        if (payment.getTransactionCode() != null
                && !payment.getTransactionCode().isBlank()) {
            return;
        }

        String safePrefix =
                prefix != null && !prefix.isBlank()
                        ? prefix.trim().toUpperCase()
                        : "PAY";

        if (payment.getOrderCode() != null) {
            payment.setTransactionCode(
                    safePrefix
                            + "-"
                            + payment.getOrderCode()
            );
            return;
        }

        payment.setTransactionCode(
                safePrefix
                        + "-"
                        + payment.getPaymentId()
                        .toString()
                        .replace("-", "")
                        .substring(0, 12)
                        .toUpperCase()
        );
    }

    private String firstNonBlank(
            Object... values
    ) {
        if (values == null) {
            return null;
        }

        for (Object value : values) {
            if (value == null) {
                continue;
            }

            String text =
                    String.valueOf(value).trim();

            if (!text.isBlank()
                    && !"null".equalsIgnoreCase(text)) {
                return text;
            }
        }

        return null;
    }

}
