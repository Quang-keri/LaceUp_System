package org.sport.backend.serviceImpl;

import com.fasterxml.jackson.core.JsonProcessingException;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.constant.PaymentType;
// import org.sport.backend.constant.WalletStatus; // Tạm comment
// import org.sport.backend.entity.Wallet; // Tạm comment
import org.sport.backend.dto.request.payment.CheckoutRequest;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.payment.CheckoutResponse;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.BookingIntent;
import org.sport.backend.entity.Payment;
import org.sport.backend.entity.User;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.properties.PayOsProperties;
import org.sport.backend.repository.BookingIntentRepository;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.repository.PaymentRepository;
// import org.sport.backend.repository.WalletRepository; // Tạm comment
import org.sport.backend.service.BookingService;
import org.sport.backend.service.PaymentService;
import org.sport.backend.service.UserService;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.WebhookData;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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
            payment.setPaymentStatus(PaymentStatus.COMPLETED);
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

        // ví đang để tạm
        // if (method == PaymentMethod.WALLET) {
        //     return handleWalletCheckout(intent, currentUser);
        // }

        if (method == PaymentMethod.BANK_TRANSFER || method == PaymentMethod.PAY_OS) {
            boolean isDeposit = Boolean.TRUE.equals(checkoutRequest.getIsDeposit());
            BigDecimal amountToPay;
            PaymentType paymentType;

            if (isDeposit) {

                amountToPay = intent.getPreviewPrice()
                        .multiply(new BigDecimal("0.50"))
                        .setScale(0, RoundingMode.HALF_UP);
                paymentType = PaymentType.DEPOSIT;
            } else {
                amountToPay = intent.getPreviewPrice();
                paymentType = PaymentType.FULL;
            }

            log.info("Bắt đầu checkout PayOS: BookingIntent={}, Amount={}, Type={}",
                    intent.getBookingIntentId(), amountToPay, paymentType);

            return handlePayOsCheckout(intent, currentUser, method, amountToPay, paymentType);
        }
        throw new RuntimeException("Phương thức thanh toán chưa được hỗ trợ");
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
            Optional<Payment> optionalPayment = paymentRepository.findByPayosOrderCode(orderCode);
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
        Payment payment = paymentRepository.findByPayosOrderCode(Long.parseLong(orderCode))
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


    // [TẠM ẨN HÀM WALLET]
    // ==========================================
    /*
    private CheckoutResponse handleWalletCheckout(BookingIntent intent, User user) {
        // ... Code xử lý wallet cũ của bạn ...
        return null;
    }
    */


    //2
    private CheckoutResponse handlePayOsCheckout(BookingIntent intent, User user, PaymentMethod method, BigDecimal amountToPay, PaymentType paymentType) {
        PayOS payOS = requirePayOsClient();
        long orderCode = generateUniqueOrderCode();

        Payment payment = Payment.builder()
                .bookingIntent(intent)
                .amount(amountToPay) // Lưu đúng số tiền (Cọc hoặc Full)
                .paymentMethod(method)
                .paymentType(paymentType)
                .paymentStatus(PaymentStatus.PENDING)
                .transactionDate(LocalDateTime.now())
                .user(user)
                .payosOrderCode(orderCode)
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
            throw new RuntimeException("Không thể tạo link thanh toán PAYOS");
        }
    }

    private void finalizePaidBookingPayment(Payment payment) {
        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS && payment.getBooking() != null) {
            return;
        }
        if (payment.getBookingIntent() != null && payment.getBookingIntent().getStatus() == BookingIntentStatus.CONFIRMED && payment.getBooking() != null) {
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(payment);
            return;
        }

        try {
            BookingIntent intent = payment.getBookingIntent();

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


            // [TẠM ẨN WALLET]
            // ==========================================
            /*
            Wallet renterWallet = walletRepository.findByUser(payment.getUser())
                    .orElseGet(() -> walletRepository.save(Wallet.builder()
                            .user(payment.getUser())
                            .balance(BigDecimal.ZERO)
                            .frozenAmount(BigDecimal.ZERO)
                            .walletStatus(WalletStatus.ACTIVE)
                            .build()));
            BigDecimal sameBalance = renterWallet.getBalance();
            createWalletPaymentTransactionSafely(
                    renterWallet,
                    booking.getBookingId(),
                    payment.getAmount(),
                    sameBalance,
                    sameBalance,
                    "Thanh toan booking qua PayOS",
                    "booking_checkout_payos"
            );
            */

        } catch (Exception e) { // Đổi catch Throwable chung để bắt được lỗi NotFound
            throw new RuntimeException("Không thể tạo booking/invoice cho thanh toán PayOS", e);
        }
    }

    private boolean tryFinalizeByPayOsPaymentStatus(Payment payment) {
        PayOS payOS = requirePayOsClient();
        if (payOS == null || payment.getPayosOrderCode() == null) {
            return false;
        }
        try {
            Object linkData = payOS.paymentRequests().get(payment.getPayosOrderCode());
            Map<String, Object> data = objectMapper.convertValue(linkData, Map.class);
            String status = String.valueOf(data.getOrDefault("status", ""));
            if (!"PAID".equalsIgnoreCase(status)) {
                return false;
            }
            finalizePaidBookingPayment(payment);
            return true;
        } catch (Exception e) {
            log.warn("Cannot verify PAYOS payment status from result page. orderCode={}", payment.getPayosOrderCode(), e);
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
        while (paymentRepository.findByPayosOrderCode(orderCode).isPresent()) {
            orderCode++;
            attempts++;
            if (attempts > 10_000) {
                throw new RuntimeException("Không thể sinh orderCode duy nhất cho PAYOS");
            }
        }
        return orderCode;
    }

    private String buildBookingReturnUrl(long orderCode, String status) {
        String fallback = "http://localhost:5173/payment/booking-result";
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
        String fallback = "http://localhost:9999/bookings/" + bookingId + "/invoice/view";
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
}