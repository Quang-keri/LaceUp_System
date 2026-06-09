package org.sport.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.response.booking.BookingIntentResponse;
import org.sport.backend.entity.Payment;
import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.service.BookingIntentService;
import org.sport.backend.service.BookingService;
import org.sport.backend.service.MomoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment/momo")
@RequiredArgsConstructor
@Slf4j
public class MomoPaymentController {

    private final MomoService momoService;
    private final BookingService bookingService;
    private final BookingIntentService bookingIntentService;

    /**
     * 1. API App gọi lên để tạo link thanh toán dựa vào Booking Intent
     */
    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, String> request) {
        try {
            UUID bookingIntentId = UUID.fromString(request.get("bookingIntentId"));

            BookingIntentResponse intentResponse = bookingIntentService.getBookingIntentById(bookingIntentId);
            long amount = intentResponse.getPreviewPrice().longValue();

            String orderInfo = "Thanh toan dat san LaceUP - ID: " + bookingIntentId;

            String payUrl = momoService.createMomoPayment(bookingIntentId.toString(), amount, orderInfo);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Tạo URL thanh toán thành công",
                    "payUrl", payUrl
            ));
        } catch (Exception e) {
            log.error("Lỗi khi tạo thanh toán MoMo: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 2. IPN xử lý kết quả và gọi confirmBooking
     */
    @PostMapping("/ipn")
    public ResponseEntity<?> handleMomoIPN(@RequestBody Map<String, Object> requestBody) {
        log.info("Nhận được IPN từ MoMo: {}", requestBody);

        try {
            int resultCode = (int) requestBody.get("resultCode");
            // Cái orderId này chính là cái bookingIntentId dạng string mình gửi đi ở hàm create
            String orderIdStr = (String) requestBody.get("orderId");
            String momoSignature = (String) requestBody.get("signature");

            // Mở comment để verify signature khi test thật nhé
            boolean isValidSignature = momoService.verifySignature(requestBody, momoSignature);
            if (!isValidSignature) {
                log.warn("Chữ ký MoMo không hợp lệ!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            if (resultCode == 0) {
                log.info("Giao dịch thành công cho Booking Intent: {}", orderIdStr);

                UUID bookingIntentId = UUID.fromString(orderIdStr);

                // Trích xuất số tiền đã thanh toán từ IPN
                long amountPaid = Long.parseLong(requestBody.get("amount").toString());

                // Build object Payment để truyền vào hàm confirmBooking của bạn
                Payment payment = Payment.builder()
                        .amount(BigDecimal.valueOf(amountPaid))
                        .paymentMethod(PaymentMethod.MOMO)
                        .transactionDate(LocalDateTime.now())
                        // set thêm các trường khác nếu entity Payment yêu cầu
                        .build();

                // Chốt đơn! Chuyển trạng thái từ Intent -> Booking thật
                bookingService.confirmBooking(bookingIntentId, payment);

            } else {
                log.info("Giao dịch thất bại cho Booking Intent: {}, Mã lỗi: {}", orderIdStr, resultCode);
                // Có thể viết thêm logic xóa BookingIntent hoặc đổi status thành FAILED
            }

            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            log.error("Lỗi xử lý IPN MoMo: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/return")
    public ResponseEntity<?> handleMomoReturn(@RequestParam Map<String, String> params) {
        log.info("Người dùng quay lại từ MoMo với params: {}", params);

        String resultCode = params.get("resultCode");
        if ("0".equals(resultCode)) {
            return ResponseEntity.ok(Map.of("message", "Giao dịch thành công. Đặt sân thành công!"));
        } else {
            return ResponseEntity.ok(Map.of("message", "Giao dịch thất bại hoặc đã bị hủy!"));
        }
    }
}