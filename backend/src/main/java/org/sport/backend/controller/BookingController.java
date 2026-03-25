package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.request.booking.UpdateBookingRequest;
import org.sport.backend.dto.request.slot.SlotRequest;
import org.sport.backend.service.BookingService;
import org.sport.backend.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@Tag(name = "10. Booking")
public class BookingController {

    @Autowired
    private BookingService bookingService;
    @Autowired
    private InvoiceService invoiceService;

    @PostMapping("/check-availability")
    public ApiResponse<?> checkAvailability(@RequestBody SlotRequest request) {
        // Cứ gọi thẳng, lỗi thì Global Exception Handler sẽ tự lo
        return ApiResponse.success(200, "Check availability successfully", bookingService.checkAvailability(request));
    }


    @PostMapping("/intent")
    public ApiResponse<?> createIntent(
            @Valid @RequestBody BookingRequest request
    ) {

        return ApiResponse.success(200, "Create booking intent successfully",
                bookingService.createBookingIntent(request)
        );
    }

    @GetMapping("/intent/{intentId}")
    public ApiResponse<?> getBookingIntentById(@PathVariable UUID intentId) {

        return ApiResponse.success(
                200,
                "Get booking intent successfully",
                bookingService.getBookingIntentById(intentId)
        );
    }

    @PostMapping("/confirm/{intentId}")
    public ApiResponse<?> confirmBooking(
            @PathVariable UUID intentId
    ) {

        return ApiResponse.success(
                bookingService.confirmBooking(intentId, null)
        );
    }

    @GetMapping("/{bookingId}")
    public ApiResponse<?> getBooking(@PathVariable UUID bookingId) {
        try {
            return ApiResponse.success(200,
                    "Get booking by id successfully",
                    bookingService.getBookingById(bookingId));

        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }


    @GetMapping(value = "/{bookingId}/invoice/view", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> viewInvoice(@PathVariable UUID bookingId) {
        try {
            var booking = bookingService.getBookingById(bookingId);
            // Build a minimal HTML invoice for printing
            StringBuilder html = new StringBuilder();
            html.append("<html><head><meta charset=\"utf-8\"><title>Invoice</title>");
            html.append("<style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style>");
            html.append("</head><body>");
            html.append("<h2>Hóa đơn dịch vụ</h2>");
            html.append("<p>Mã booking: " + booking.getBookingId() + "</p>");
            html.append("<p>Khách hàng: " + booking.getUserName() + " - " + booking.getPhoneNumber() + "</p>");
            html.append("<table><thead><tr><th>Sân</th><th>Giờ bắt đầu</th><th>Giờ kết thúc</th><th>Giá</th></tr></thead><tbody>");
            booking.getSlots().forEach(s -> {
                html.append("<tr>");
                html.append("<td>" + s.getCourtCode() + "</td>");
                html.append("<td>" + s.getStartTime() + "</td>");
                html.append("<td>" + s.getEndTime() + "</td>");
                html.append("<td>" + (s.getPrice() != null ? s.getPrice().toString() : "0") + "</td>");
                html.append("</tr>");
            });
            html.append("</tbody></table>");
            html.append("<p>Tổng: " + (booking.getTotalPrice() != null ? booking.getTotalPrice() : "0") + "</p>");
            html.append("</body></html>");

            return ResponseEntity.ok(html.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error rendering invoice: " + e.getMessage());
        }
    }

    @GetMapping("/{bookingId}/invoice/download")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable UUID bookingId) {
        var booking = bookingService.getBookingById(bookingId);
        byte[] pdf = invoiceService.generateInvoicePdf(booking);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice_" + bookingId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PutMapping("/{bookingId}/collect-payment")
    public ResponseEntity<?> collectRemainingPayment(@PathVariable UUID bookingId) {
        try {
            bookingService.collectRemainingPayment(bookingId);
            return ResponseEntity.ok(ApiResponse.success(200,"Payment successfully",null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(500,"Error when payment"+e.getMessage()));
        }
    }

    @GetMapping
    public ApiResponse<?> getAllBooking(
            @RequestParam(required = false) BookingStatus bookingStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDate to,
            @RequestParam(defaultValue = "1", required = false) int page,
            @RequestParam(defaultValue = "10", required = false) int size) {
        try {

            return ApiResponse.builder()
                    .code(200)
                    .message("Get all bookings successfully")
                    .result(bookingService.getAllBookings(bookingStatus, keyword, from, to, page, size))
                    .build();
        } catch (Exception e) {
            e.getStackTrace();
            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problems " + e.getMessage())
                    .build();
        }
    }

    @PutMapping("/{bookingId}")
    public ApiResponse<?> updateBooking(
            @PathVariable UUID bookingId,
            @Valid @RequestBody UpdateBookingRequest request
    ) {
        try {


            if (request.getSlots() != null && !request.getSlots().isEmpty()) {
                System.out.println("📍 Slot Times Received:");
                for (int i = 0; i < request.getSlots().size(); i++) {
                    var slot = request.getSlots().get(i);
                    System.out.println("   Slot " + i + ": " + slot.getStartTime() + " → " + slot.getEndTime());
                }
            }


            return ApiResponse.builder()
                    .code(200)
                    .message("Update booking successfully")
                    .result(bookingService.updateBooking(bookingId, request))
                    .build();

        } catch (Exception e) {
            System.err.println("ERROR in updateBooking: " + e.getMessage());
            e.printStackTrace();

            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problems " + e.getMessage())
                    .build();
        }
    }

    @GetMapping("/my-rentals")
    public ApiResponse<?> getMyRentals(
            @RequestParam UUID rentalId,
            @RequestParam(required = false) BookingStatus bookingStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDate to,
            @RequestParam(defaultValue = "1", required = false) int page,
            @RequestParam(defaultValue = "10", required = false) int size) {
        try {

            return ApiResponse.builder()
                    .code(200)
                    .message("Get all bookings of rental successfully")
                    .result(bookingService.getBookingsRentalId(rentalId, bookingStatus, keyword, from, to, page, size))
                    .build();
        } catch (Exception e) {
            e.getStackTrace();
            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problems " + e.getMessage())
                    .build();
        }
    }

    @GetMapping("/my-bookings")
    public ApiResponse<?> getMyBookings(
            @RequestParam UUID userId,
            @RequestParam(required = false) BookingStatus bookingStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDate to,
            @RequestParam(defaultValue = "1", required = false) int page,
            @RequestParam(defaultValue = "10", required = false) int size) {
        try {

            return ApiResponse.builder()
                    .code(200)
                    .message("Get all bookings of me successfully")
                    .result(bookingService.getMyBookings(userId, bookingStatus, keyword, from, to, page, size))
                    .build();
        } catch (Exception e) {
            e.getStackTrace();
            return ApiResponse.builder()
                    .code(500)
                    .message("Api system have some problems " + e.getMessage())
                    .build();
        }
    }

}
