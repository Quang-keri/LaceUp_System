package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.BookingType;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.booking.OwnerBookingRequest;
import org.sport.backend.dto.request.booking.UpdateBookingRequest;
import org.sport.backend.dto.request.serviceItem.AddExtraServicesRequest;
import org.sport.backend.dto.request.slot.SlotRequest;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.booking.SharedBookingPublicResponse;
import org.sport.backend.dto.response.slot.CheckAvailabilityResponse;
import org.sport.backend.service.BookingService;
import org.sport.backend.service.BookingQueryService;
import org.sport.backend.service.ExcelService;
import org.sport.backend.service.InvoiceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@Tag(name = "10. Booking Core")
public class BookingController {

    private final BookingService bookingService;
    private final BookingQueryService bookingQueryService;
    private final InvoiceService invoiceService;
    private final ExcelService excelService;

    @PostMapping("/preview-price")
    public ResponseEntity<?> previewOwnerBookingPrice(
            @RequestBody OwnerBookingRequest request) {
        BigDecimal total = bookingService.previewOwnerBookingPrice(request);
        return ResponseEntity.ok(new ApiResponse<>(
                200,
                "Preview price successfully",
                total));
    }

    @PostMapping("/owner")
    @PreAuthorize("hasAuthority('MANAGE_BOOKING')")
    public ApiResponse<BookingResponse> ownerCreateBooking(
            @Valid @RequestBody OwnerBookingRequest request) {
        try {
            return ApiResponse.success(
                    201,
                    "Tạo lịch đặt sân cho khách thành công",
                    bookingService.createOwnerBooking(request));
        } catch (Exception e) {
            return ApiResponse.error(
                    500,
                    "Lỗi tạo lịch: " + e.getMessage());
        }
    }

    @PostMapping("/{bookingId}/services")
    public ResponseEntity<ApiResponse<Void>> addExtraServicesToBooking(
            @PathVariable UUID bookingId,
            @RequestBody AddExtraServicesRequest request) {
        try {
            bookingService.addExtraServices(bookingId, request);
            return ResponseEntity.ok(ApiResponse.success(
                    200,
                    "Thêm dịch vụ thành công",
                    null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(
                            400,
                            "Lỗi thêm dịch vụ: " + e.getMessage()));
        }
    }

    @PostMapping("/check-availability")
    public ApiResponse<CheckAvailabilityResponse> checkAvailability(
            @RequestBody @Valid SlotRequest request) {
        return ApiResponse.success(
                200,
                "Check availability successfully",
                bookingService.checkAvailability(request));
    }

    @PostMapping("/confirm/{intentId}")
    public ApiResponse<BookingResponse> confirmBooking(
            @PathVariable UUID intentId) {
        return ApiResponse.success(
                bookingService.confirmBooking(intentId, null));
    }

    @GetMapping("/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<BookingResponse> getBooking(
            @PathVariable UUID bookingId) {
        try {
            return ApiResponse.success(
                    200,
                    "Get booking by id successfully",
                    bookingQueryService.getBookingById(bookingId));
        } catch (Exception e) {
            return ApiResponse.error(
                    500,
                    e.getMessage());
        }
    }

    @GetMapping("/shared/{bookingId}/public")
    public ApiResponse<SharedBookingPublicResponse> getPublicSharedBooking(
            @PathVariable UUID bookingId
    ) {
        return ApiResponse.<SharedBookingPublicResponse>builder()
                .code(200)
                .message("Get public shared booking successfully")
                .result(bookingQueryService.getPublicSharedBooking(bookingId))
                .build();
    }

    @GetMapping(value = "/{bookingId}/invoice/view",
            produces = MediaType.TEXT_HTML_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> viewInvoice(@PathVariable UUID bookingId) {
        try {
            var booking = bookingQueryService.getBookingById(bookingId);
            StringBuilder html = new StringBuilder();
            html.append("<html><head><meta charset=\"utf-8\"><title>Invoice</title>");
            html.append("<style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style>");
            html.append("</head><body><h2>Hóa đơn dịch vụ</h2>");
            html.append("<p>Mã booking: ").append(booking.getBookingId()).append("</p>");
            html.append("<p>Khách hàng: ").append(booking.getUserName()).append(" - ").append(booking.getPhoneNumber()).append("</p>");
            html.append("<table><thead><tr><th>Sân</th><th>Giờ bắt đầu</th><th>Giờ kết thúc</th><th>Giá</th></tr></thead><tbody>");
            booking.getSlots().forEach(s -> html.append("<tr><td>").append(s.getCourtCode()).append("</td>")
                    .append("<td>").append(s.getStartTime()).append("</td>")
                    .append("<td>").append(s.getEndTime()).append("</td>")
                    .append("<td>").append(s.getPrice() != null ? s.getPrice().toString() : "0").append("</td></tr>"));
            html.append("</tbody></table><p>Tổng: ").append(booking.getTotalPrice() != null ? booking.getTotalPrice() : "0").append("</p></body></html>");
            return ResponseEntity.ok(html.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error rendering invoice: " + e.getMessage());
        }
    }

    @GetMapping("/{bookingId}/invoice/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadInvoice(
            @PathVariable UUID bookingId) {
        var booking = bookingQueryService.getBookingById(bookingId);
        byte[] pdf = invoiceService.generateInvoicePdf(booking);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=invoice_" + bookingId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PutMapping("/{bookingId}/collect-payment")
    public ResponseEntity<ApiResponse<Void>> collectRemainingPayment(
            @PathVariable UUID bookingId) {
        try {
            bookingService.collectRemainingPayment(bookingId);
            return ResponseEntity.ok(ApiResponse.success(
                    200,
                    "Payment successfully",
                    null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    500,
                    "Error when payment" + e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_BOOKINGS')")
    public ApiResponse<PageResponse<BookingResponse>> getAllBooking(
            @RequestParam(required = false) BookingStatus bookingStatus,
            @RequestParam(required = false) BookingType bookingType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDate to,
            @RequestParam(defaultValue = "1", required = false) int page,
            @RequestParam(defaultValue = "10", required = false) int size
    ) {
        try {
            return ApiResponse.<PageResponse<BookingResponse>>builder()
                    .code(200)
                    .message("Get all bookings successfully")
                    .result(bookingQueryService
                            .getAllBookings(
                                    bookingStatus,
                                    bookingType,
                                    keyword,
                                    from,
                                    to,
                                    page,
                                    size))
                    .build();
        } catch (Exception e) {
            return ApiResponse.<PageResponse<BookingResponse>>builder()
                    .code(500)
                    .message("Api problem: " + e.getMessage())
                    .build();
        }
    }

    @PutMapping("/{bookingId}")
    @PreAuthorize("hasAuthority('MANAGE_BOOKING')")
    public ApiResponse<BookingResponse> updateBooking(
            @PathVariable UUID bookingId,
            @Valid @RequestBody UpdateBookingRequest request) {
        try {
            return ApiResponse.<BookingResponse>builder()
                    .code(200)
                    .message("Update booking successfully")
                    .result(bookingService.updateBooking(bookingId, request))
                    .build();
        } catch (Exception e) {
            return ApiResponse.<BookingResponse>builder()
                    .code(500)
                    .message("Api problem: " + e.getMessage())
                    .build();
        }
    }

    @GetMapping("/my-rentals")
    public ApiResponse<PageResponse<BookingResponse>> getMyRentals(
            @RequestParam UUID rentalId,
            @RequestParam(required = false) BookingStatus bookingStatus,
            @RequestParam(required = false) BookingType bookingType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDate to,
            @RequestParam(defaultValue = "1", required = false) int page,
            @RequestParam(defaultValue = "10", required = false) int size
    ) {
        try {
            return ApiResponse.<PageResponse<BookingResponse>>builder()
                    .code(200)
                    .message("Get all bookings of rental successfully")
                    .result(bookingQueryService
                            .getBookingsRentalId(rentalId,
                                    bookingStatus,
                                    bookingType,
                                    keyword,
                                    from,
                                    to,
                                    page,
                                    size))
                    .build();
        } catch (Exception e) {
            return ApiResponse.<PageResponse<BookingResponse>>builder()
                    .code(500)
                    .message("Api problem: " + e.getMessage())
                    .build();
        }
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResponse<BookingResponse>> getMyBookings(
            @RequestParam(required = false) BookingStatus bookingStatus,
            @RequestParam(required = false) BookingType bookingType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDate to,
            @RequestParam(defaultValue = "1", required = false) int page,
            @RequestParam(defaultValue = "10", required = false) int size
    ) {
        try {
            return ApiResponse.<PageResponse<BookingResponse>>builder()
                    .code(200)
                    .message("Get all bookings of me successfully")
                    .result(bookingQueryService
                            .getMyBookings(
                                    bookingStatus,
                                    bookingType,
                                    keyword,
                                    from,
                                    to,
                                    page,
                                    size))
                    .build();
        } catch (Exception e) {
            return ApiResponse.<PageResponse<BookingResponse>>builder()
                    .code(500)
                    .message("Api problem: " + e.getMessage())
                    .build();
        }
    }

    @GetMapping("/export/excel")
    @PreAuthorize("hasAuthority('VIEW_BOOKINGS')")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(required = false) BookingStatus bookingStatus,
            @RequestParam(required = false) BookingType bookingType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) UUID rentalId
    ) {
        try {
            List<BookingResponse> bookings;
            if (rentalId != null) {
                bookings =
                        bookingQueryService.getBookingsRentalId(
                                        rentalId,
                                        bookingStatus,
                                        bookingType,
                                        keyword,
                                        from,
                                        to,
                                        1,
                                        Integer.MAX_VALUE)
                                .getData();
            } else {
                bookings =
                        bookingQueryService.getAllBookings(
                                        bookingStatus,
                                        bookingType,
                                        keyword,
                                        from,
                                        to,
                                        1,
                                        Integer.MAX_VALUE)
                                .getData();
            }
            byte[] excelContent = excelService.exportBookingsToExcel(bookings);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=bookings_report.xlsx")
                    .contentType(MediaType
                            .parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelContent);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{bookingId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable UUID bookingId) {
        try {
            BookingResponse response = bookingService.cancelBookingByUser(bookingId);
            return ResponseEntity.ok(ApiResponse.success(
                    200,
                    "Hủy booking thành công. Tiền cọc sẽ không được hoàn lại.",
                    response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    400,
                    e.getMessage()));
        }
    }
}