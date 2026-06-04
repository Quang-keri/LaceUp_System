package org.sport.backend.serviceImpl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.config.VnPayConfig;
import org.sport.backend.constant.*;

import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.payment.CheckoutResponse;
import org.sport.backend.dto.response.payment.RefundResponse;
import org.sport.backend.entity.*;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.properties.PayOsProperties;
import org.sport.backend.properties.UrlProperties;
import org.sport.backend.repository.*;

import org.sport.backend.service.BookingService;
import org.sport.backend.service.EmailService;
import org.sport.backend.service.PaymentService;
import org.sport.backend.service.UserService;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
public class PaymentServiceImpl implements PaymentService {
    @Autowired
    private BookingService bookingService;
    @Autowired
    private BookingIntentRepository bookingIntentRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private UserService userService;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private PayOsProperties payOsProperties;
    @Autowired
    private ObjectProvider<PayOS> payOSProvider;
    @Autowired
    private VnPayConfig vnPayConfig;
    @Autowired
    private UrlProperties urlProperties;
    @Autowired
    private MatchRegistrationRepository matchRegistrationRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private CloudinaryServiceImpl cloudinaryService;
    @Autowired
    private EmailService emailService;

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
        }

        return CheckoutResponse.builder()
                .mode("FAILED")
                .paymentStatus(payment.getPaymentStatus())
                .orderCode(orderCode)
                .message("Thanh toán chưa thành công")
                .build();
    }

    private CheckoutResponse handleVnPayCheckout(BookingIntent intent, User user, PaymentMethod method, BigDecimal amountToPay, PaymentType paymentType) {
        long orderCode = generateUniqueOrderCode();

        Payment payment = Payment.builder()
                .bookingIntent(intent)
                .amount(amountToPay)
                .paymentMethod(method)
                .paymentType(paymentType)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now())
                .user(user)
                .orderCode(orderCode)
                .build();
        paymentRepository.save(payment);

        try {
            String description = "Thanh toan booking " + intent.getBookingIntentId().toString().substring(0, 8);
            String paymentUrl = vnPayConfig.createPaymentUrl(orderCode, amountToPay.longValue(), description);

            return CheckoutResponse.builder()
                    .mode("REDIRECT")
                    .paymentStatus(PaymentStatus.PENDING)
                    .paymentUrl(paymentUrl)
                    .orderCode(String.valueOf(orderCode))
                    .message("Tạo link thanh toán VNPay thành công")
                    .build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Không thể tạo link thanh toán VNPay", e);
        }
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

        if ("00".equals(vnp_ResponseCode)) {

            if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
                // Tái sử dụng hàm finalize booking của bạn
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
            // Thanh toán thất bại hoặc bị hủy
            if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
                payment.setPaymentStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }

            return CheckoutResponse.builder()
                    .mode("FAILED")
                    .paymentStatus(PaymentStatus.FAILED)
                    .orderCode(String.valueOf(orderCode))
                    .message("Thanh toán VNPay không thành công (Mã lỗi: " + vnp_ResponseCode + ")")
                    .build();
        }
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

        // Nếu app mở lại màn VietQR, dùng lại payment VietQR cũ, không tạo thêm dòng mới
        if (method == PaymentMethod.VIET_QR) {
            Optional<Payment> existingVietQr = pendingPayments.stream()
                    .filter(p -> p.getPaymentMethod() == PaymentMethod.VIET_QR)
                    .max(java.util.Comparator.comparing(Payment::getTransactionDate));

            if (existingVietQr.isPresent()) {
                return handleVietQrMatchJoin(existingVietQr.get(), reg);
            }
        }

        // Nếu đổi phương thức thanh toán, hủy các payment pending cũ để khỏi loạn
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

        paymentRepository.save(payment);

        if (method == PaymentMethod.VN_PAY) {
            return handleVnPayMatchJoin(payment, reg);
        }

        if (method == PaymentMethod.PAY_OS) {
            return handlePayOsMatchJoin(payment, reg);
        }

        if (method == PaymentMethod.VIET_QR) {
            return handleVietQrMatchJoin(payment, reg);
        }

        throw new RuntimeException("Phương thức thanh toán chưa được hỗ trợ cho ghép trận: " + method);
    }

    @Override
    public PageResponse<RefundResponse> getPendingRefunds(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("transactionDate").descending());

        Page<Payment> payments = paymentRepository.findByPaymentStatus(PaymentStatus.REFUND_PENDING, pageable);

        List<RefundResponse> responses = payments.getContent().stream().map(p -> {
            String source = (p.getPaymentType() == PaymentType.MATCH_JOIN) ? "MATCH" : "BOOKING";

            String refCode = "N/A";
            if (source.equals("MATCH") && p.getMatchRegistration() != null) {
                refCode = p.getMatchRegistration().getMatch().getRoomCode();
            } else if (source.equals("BOOKING") && p.getBooking() != null) {
                refCode = p.getBooking().getBookingId().toString().substring(0, 8).toUpperCase();
            }

            BankAccount bank = p.getUser() != null ? p.getUser().getBankAccount() : null;
            String bankNameStr = bank != null ? bank.getBankName() : null;
            String accNumStr = bank != null ? bank.getAccountNumber() : null;
            String accNameStr = bank != null ? bank.getAccountHolderName() : null;

            String qrUrl = null;
            if (bankNameStr != null && accNumStr != null) {
                // Lời nhắn chuyển khoản (Ví dụ: LACEUP HOAN TIEN 123456)
                String description = "LACEUP HOAN TIEN " + p.getOrderCode();

                // Format link ảnh QR chuẩn của VietQR
                qrUrl = String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                        bankNameStr,
                        accNumStr,
                        p.getAmount().longValue(),
                        description.replace(" ", "%20"), // URL encode dấu cách
                        accNameStr != null ? accNameStr.replace(" ", "%20") : ""
                );
            }

            return RefundResponse.builder()
                    .paymentId(p.getPaymentId())
                    .userName(p.getUser() != null ? p.getUser().getUserName() : "Khách ẩn danh")
                    .phone(p.getUser() != null ? p.getUser().getPhone() : "N/A")
                    .amount(p.getAmount())
                    .paymentMethod(p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "VN_PAY")
                    .orderCode(String.valueOf(p.getOrderCode()))
                    .transactionDate(p.getTransactionDate())
                    .source(source)
                    .referenceCode(refCode)
                    .bankName(bankNameStr)
                    .accountNumber(accNumStr)
                    .accountHolderName(accNameStr)
                    .qrCodeUrl(qrUrl)
                    .build();
        }).collect(Collectors.toList());

        return PageResponse.of(payments, responses);
    }

    @Override
    public PageResponse<RefundResponse> getCompletedRefunds(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("transactionDate").descending());

        Page<Payment> payments = paymentRepository.findByPaymentStatus(PaymentStatus.REFUNDED, pageable);

        List<RefundResponse> responses = payments.getContent().stream().map(p -> {
            String source = (p.getPaymentType() == PaymentType.MATCH_JOIN) ? "MATCH" : "BOOKING";

            String refCode = "N/A";
            if (source.equals("MATCH") && p.getMatchRegistration() != null) {
                refCode = p.getMatchRegistration().getMatch().getRoomCode();
            } else if (source.equals("BOOKING") && p.getBooking() != null) {
                refCode = p.getBooking().getBookingId().toString().substring(0, 8).toUpperCase();
            }

            BankAccount bank = p.getUser() != null ? p.getUser().getBankAccount() : null;
            String bankNameStr = bank != null ? bank.getBankName() : null;
            String accNumStr = bank != null ? bank.getAccountNumber() : null;
            String accNameStr = bank != null ? bank.getAccountHolderName() : null;

            return RefundResponse.builder()
                    .paymentId(p.getPaymentId())
                    .userName(p.getUser() != null ? p.getUser().getUserName() : "Khách ẩn danh")
                    .phone(p.getUser() != null ? p.getUser().getPhone() : "N/A")
                    .amount(p.getAmount())
                    .paymentMethod(p.getPaymentMethod() != null ? p.getPaymentMethod().name() : "VN_PAY")
                    .orderCode(String.valueOf(p.getOrderCode()))
                    .transactionDate(p.getTransactionDate())
                    .source(source)
                    .referenceCode(refCode)
                    .bankName(bankNameStr)
                    .accountNumber(accNumStr)
                    .accountHolderName(accNameStr)
                    .qrCodeUrl(null)
                    .build();
        }).collect(Collectors.toList());

        return PageResponse.of(payments, responses);
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
            String imageUrl = uploadResult.getUrl();

            payment.setProof(imageUrl);
            paymentRepository.save(payment);

            log.info(
                    "Đã nhận ảnh chứng từ VietQR ghép kèo. RegID: {}, PaymentID: {}, Method: {}, URL: {}",
                    registrationId,
                    payment.getPaymentId(),
                    payment.getPaymentMethod(),
                    imageUrl
            );

        } catch (Exception e) {
            log.error("Lỗi khi upload ảnh chứng từ ghép kèo: ", e);
            throw new RuntimeException("Không thể tải ảnh chứng từ lên hệ thống", e);
        }
    }

    @Override
    public List<Map<String, Object>> getMatchPaymentsForOwner(
            String status, String keyword, String startDateStr, String endDateStr
    ) {
        User owner = userService.getCurrentUserEntity();

        LocalDate startDate = (startDateStr != null && !startDateStr.isBlank()) ? LocalDate.parse(startDateStr) : null;
        LocalDate endDate = (endDateStr != null && !endDateStr.isBlank()) ? LocalDate.parse(endDateStr) : null;
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";

        return paymentRepository.findAll().stream()
                .filter(p -> p.getPaymentType() == PaymentType.MATCH_JOIN)
                .filter(p -> p.getPaymentMethod() == PaymentMethod.VIET_QR)
                .filter(p -> p.getProof() != null && !p.getProof().isEmpty())
                .filter(p -> {
                    // Chỉ lấy sân của Owner
                    if (p.getMatchRegistration() != null && p.getMatchRegistration().getMatch() != null) {
                        RentalArea area = p.getMatchRegistration().getMatch().getCourt().getRentalArea();
                        return area != null && area.getOwner().getUserId().equals(owner.getUserId());
                    }
                    return false;
                })
                .filter(p -> {
                    // Lọc theo Tab: PENDING (Chờ duyệt) hoặc PROCESSED (Lịch sử: SUCCESS / FAILED)
                    if ("PENDING".equalsIgnoreCase(status)) {
                        return p.getPaymentStatus() == PaymentStatus.PENDING;
                    } else if ("PROCESSED".equalsIgnoreCase(status)) {
                        return p.getPaymentStatus() == PaymentStatus.SUCCESS || p.getPaymentStatus() == PaymentStatus.FAILED;
                    }
                    return true;
                })
                .filter(p -> {
                    // Lọc theo ngày
                    if (startDate != null && p.getTransactionDate().toLocalDate().isBefore(startDate)) return false;
                    if (endDate != null && p.getTransactionDate().toLocalDate().isAfter(endDate)) return false;
                    return true;
                })
                .filter(p -> {
                    // Lọc theo keyword (Tên, SĐT, Mã phòng)
                    if (kw.isEmpty()) return true;
                    String name = p.getUser().getUserName() != null ? p.getUser().getUserName().toLowerCase() : "";
                    String phone = p.getUser().getPhone() != null ? p.getUser().getPhone().toLowerCase() : "";
                    String room = p.getMatchRegistration().getMatch().getRoomCode() != null ? p.getMatchRegistration().getMatch().getRoomCode().toLowerCase() : "";
                    return name.contains(kw) || phone.contains(kw) || room.contains(kw);
                })
                .sorted((p1, p2) -> p2.getTransactionDate().compareTo(p1.getTransactionDate())) // Xếp mới nhất lên đầu
                .map(p -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("paymentId", p.getPaymentId());
                    map.put("amount", p.getAmount());
                    map.put("transactionDate", p.getTransactionDate());
                    map.put("proof", p.getProof());
                    map.put("userName", p.getUser().getUserName());
                    map.put("phone", p.getUser().getPhone()); // Lấy thêm SĐT
                    map.put("roomCode", p.getMatchRegistration().getMatch().getRoomCode());
                    map.put("status", p.getPaymentStatus().name()); // Trạng thái
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void confirmMatchPayment(UUID paymentId, boolean isApproved) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        if (payment.getPaymentType() != PaymentType.MATCH_JOIN) {
            throw new RuntimeException("Giao dịch này không phải thanh toán ghép trận");
        }

        if (payment.getPaymentMethod() != PaymentMethod.VIET_QR) {
            throw new RuntimeException("Owner chỉ được duyệt thanh toán VietQR");
        }

        if (payment.getProof() == null || payment.getProof().isBlank()) {
            throw new RuntimeException("Chưa có ảnh chuyển khoản");
        }

        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Giao dịch không ở trạng thái chờ duyệt");
        }

        if (isApproved) {
            finalizePaidBookingPayment(payment);
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
    }

    @Transactional
    @Override
    public void confirmManualRefund(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        if (payment.getPaymentStatus() != PaymentStatus.REFUND_PENDING) {
            throw new RuntimeException("Giao dịch này không ở trạng thái chờ hoàn tiền!");
        }

        payment.setPaymentStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

        Transaction expenseTx = Transaction.builder()
                .type(TransactionType.EXPENSE)
                .amount(payment.getAmount())
                .description("Hoàn tiền thủ công cho Order Code: " + payment.getOrderCode())
                .status(TransactionStatus.SUCCESS)
                .transactionDate(LocalDateTime.now())
                .build();
        transactionRepository.save(expenseTx);

        log.info("Admin đã xác nhận hoàn tiền thành công cho Payment ID: {}", paymentId);
    }

    private CheckoutResponse handlePayLaterCheckout(BookingIntent intent, User user, PaymentMethod method, BigDecimal amountToPay, PaymentType paymentType) {
        long orderCode = generateUniqueOrderCode();

        Payment payment = Payment.builder()
                .bookingIntent(intent)
                .amount(amountToPay)
                .paymentMethod(method)
                .paymentType(paymentType)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now())
                .user(user)
                .orderCode(orderCode)
                .build();
        paymentRepository.save(payment);

        // Tạo Booking chính thức nhưng giữ nguyên trạng thái chưa thanh toán
        finalizeUnpaidBooking(payment);

        return CheckoutResponse.builder()
                .mode("BOOKED")
                .paymentStatus(PaymentStatus.PENDING)
                .bookingId(payment.getBooking().getBookingId())
                .orderCode(String.valueOf(orderCode))
                .message("Đặt sân thành công, vui lòng thanh toán tại sân")
                .build();
    }

    // Hàm phụ trợ tạo booking cho phương thức thanh toán tại chỗ (không set PaymentStatus = SUCCESS)
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

    private CheckoutResponse handlePayOsCheckout(BookingIntent intent, User user, PaymentMethod method, BigDecimal amountToPay, PaymentType paymentType) {
        PayOS payOS = requirePayOsClient();
        long orderCode = generateUniqueOrderCode();

        Payment payment = Payment.builder()
                .bookingIntent(intent)
                .amount(amountToPay)
                .paymentMethod(method)
                .paymentType(paymentType)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now())
                .user(user)
                .orderCode(orderCode)
                .build();
        paymentRepository.save(payment);

        try {
            long amount = amountToPay.longValue();
            String itemName = paymentType == PaymentType.DEPOSIT ? "Dat coc booking" : "Thanh toan full booking";

            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name(itemName)
                    .quantity(1)
                    .price(amount)
                    .build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description("Booking " + intent.getBookingIntentId().toString().substring(0, 8))
                    .item(item)
                    .returnUrl(buildBookingReturnUrl(orderCode, "success"))
                    .cancelUrl(buildBookingReturnUrl(orderCode, "cancel"))
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            payment.setPayosPaymentLinkId(response.getPaymentLinkId());
            paymentRepository.save(payment);

            return CheckoutResponse.builder()
                    .mode("REDIRECT")
                    .paymentStatus(PaymentStatus.PENDING)
                    .paymentUrl(response.getCheckoutUrl())
                    .orderCode(String.valueOf(orderCode))
                    .message("Tạo link thanh toán thành công")
                    .build();
        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            log.error("Lỗi tạo link PayOS: ", e);
            throw new RuntimeException("Không thể tạo link thanh toán PAYOS");
        }
    }

    private void finalizePaidBookingPayment(Payment payment) {
        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
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
                                .moneyFlow(
                                        payment.getPaymentMethod() == PaymentMethod.VIET_QR
                                                ? MoneyFlow.OWNER_COLLECTED
                                                : MoneyFlow.ADMIN_COLLECTED
                                )
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

            // auto-generate invoice view URL and persist it
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

    private boolean tryFinalizeByPayOsPaymentStatus(Payment payment) {
        PayOS payOS = requirePayOsClient();
        if (payment.getOrderCode() == null) {
            return false;
        }
        try {
            Object linkData = payOS.paymentRequests().get(payment.getOrderCode());
            Map<String, Object> data = objectMapper.convertValue(linkData, Map.class);
            String status = String.valueOf(data.getOrDefault("status", ""));
            if (!"PAID".equalsIgnoreCase(status)) {
                return false;
            }
            finalizePaidBookingPayment(payment);
            return true;
        } catch (Exception e) {
            log.warn("Cannot verify PAYOS payment status from result page. orderCode={}", payment.getOrderCode(), e);
            return false;
        }
    }


    private void createWalletPaymentTransactionSafely() {
        // Tạm ẩn nội dung nếu không dùng tới Wallet
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
        if (payOS == null) {
            throw new RuntimeException("Không khởi tạo được PAYOS client");
        }
        return payOS;
    }

    private WebhookData verifyPayOsWebhook(Map<String, Object> payload) {
        PayOS payOS = payOSProvider.getIfAvailable();
        if (payOS == null) {
            return null;
        }
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
            if (attempts > 10_000) {
                throw new RuntimeException("Không thể sinh orderCode duy nhất cho PAYOS");
            }
        }
        return orderCode;
    }

    private String buildBookingReturnUrl(long orderCode, String status) {
        String fallback = urlProperties.getFrontend() + "/payment/booking-result";
        String base = payOsProperties.getReturnUrl();
        if ("cancel".equalsIgnoreCase(status)) {
            base = payOsProperties.getCancelUrl();
        }
        if (base == null || base.isBlank()) {
            return fallback + "?orderCode=" + orderCode + "&status=" + status;
        }
        try {
            URI source = URI.create(base);
            String hostBase = source.getScheme() + "://" + source.getAuthority();
            return hostBase + "/payment/booking-result?orderCode=" + orderCode + "&status=" + status;
        } catch (Exception e) {
            return fallback + "?orderCode=" + orderCode + "&status=" + status;
        }
    }

    private String buildInvoiceViewUrl(java.util.UUID bookingId) {
        String fallback = urlProperties.getBackend() + "/bookings/" + bookingId + "/invoice/view";
        String base = payOsProperties.getReturnUrl();
        if (base == null || base.isBlank()) {
            return fallback;
        }
        try {
            URI source = URI.create(base);
            String hostBase = source.getScheme() + "://" + source.getAuthority();
            return hostBase + "/bookings/" + bookingId + "/invoice/view";
        } catch (Exception e) {
            return fallback;
        }
    }

    private boolean isSuccessStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toLowerCase();
        return "success".equals(normalized) || "paid".equals(normalized) || "succeeded".equals(normalized);
    }

    private boolean isFailureStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toLowerCase();
        return "cancel".equals(normalized)
                || "cancelled".equals(normalized)
                || "canceled".equals(normalized)
                || "failed".equals(normalized)
                || "fail".equals(normalized);
    }

    private CheckoutResponse handleVnPayMatchJoin(Payment payment, MatchRegistration reg) {
        try {
            String description = "Thanh toan phi ghep tran " + reg.getMatch().getRoomCode();
            String paymentUrl = vnPayConfig.createPaymentUrl(payment.getOrderCode(), payment.getAmount().longValue(), description);

            return CheckoutResponse.builder()
                    .mode("REDIRECT")
                    .paymentStatus(PaymentStatus.PENDING)
                    .paymentUrl(paymentUrl)
                    .orderCode(String.valueOf(payment.getOrderCode()))
                    .message("Tạo link thanh toán VNPay thành công")
                    .build();
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

            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name("Phi ghep tran " + reg.getMatch().getRoomCode())
                    .quantity(1)
                    .price(amount)
                    .build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(payment.getOrderCode())
                    .amount(amount)
                    .description("Match " + reg.getMatch().getRoomCode())
                    .item(item)
                    // Tái sử dụng lại URL booking hoặc ông có thể làm URL riêng cho Match
                    .returnUrl(buildBookingReturnUrl(payment.getOrderCode(), "success"))
                    .cancelUrl(buildBookingReturnUrl(payment.getOrderCode(), "cancel"))
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            payment.setPayosPaymentLinkId(response.getPaymentLinkId());
            paymentRepository.save(payment);

            return CheckoutResponse.builder()
                    .mode("REDIRECT")
                    .paymentStatus(PaymentStatus.PENDING)
                    .paymentUrl(response.getCheckoutUrl())
                    .orderCode(String.valueOf(payment.getOrderCode()))
                    .message("Tạo link thanh toán PayOS thành công")
                    .build();
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

            String transferContent = "LACEUP MATCH "
                    + match.getMatchId().toString().substring(0, 8).toUpperCase();

            String encodedInfo = java.net.URLEncoder
                    .encode(transferContent, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");

            String encodedName = java.net.URLEncoder
                    .encode(accNameStr, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");

            String vietQrUrl = String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                    bankNameStr,
                    accNumStr,
                    amount,
                    encodedInfo,
                    encodedName
            );

            payment.setPaymentStatus(PaymentStatus.PENDING);
            paymentRepository.save(payment);

            return CheckoutResponse.builder()
                    .mode("PENDING")
                    .paymentStatus(PaymentStatus.PENDING)
                    .orderCode(String.valueOf(payment.getOrderCode()))
                    .message("Tạo mã VietQR thành công")
                    .bankName(bankNameStr)
                    .accountNumber(accNumStr)
                    .accountName(accNameStr)
                    .transferContent(transferContent)
                    .vietQrUrl(vietQrUrl)
                    .build();

        } catch (Exception e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Không thể tạo mã VietQR cho ghép trận: " + e.getMessage(), e);
        }
    }

}