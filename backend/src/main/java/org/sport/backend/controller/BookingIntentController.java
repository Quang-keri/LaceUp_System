package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.response.booking.BookingIntentResponse;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.service.BookingIntentService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings/intent")
@RequiredArgsConstructor
@Tag(name = "10.1 Booking Intent", description = "Quản lý giữ chỗ và chuyển khoản")
public class BookingIntentController {

    private final BookingIntentService bookingIntentService;

    @GetMapping("/rental/{rentalId}")
    public ApiResponse<PageResponse<BookingIntentResponse>> getRentalBookingIntents(
            @PathVariable UUID rentalId,
            @RequestParam BookingIntentStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(bookingIntentService
                .getMyRentalBookingIntents(rentalId, status, page, size));
    }

    @GetMapping("/my-intents")
    public ApiResponse<List<BookingIntentResponse>> getMyBookingIntents() {
        return ApiResponse.<List<BookingIntentResponse>>builder()
                .code(200)
                .message("Lấy danh sách booking đang chờ xác nhận thành công")
                .result(bookingIntentService.getMyBookingIntents())
                .build();
    }

    @PostMapping("/{intentId}/owner-confirm")
    public ApiResponse<BookingResponse> ownerConfirmManualBooking(
            @PathVariable UUID intentId
    ) {
        return ApiResponse.success(
                bookingIntentService.ownerConfirmManualBooking(intentId));
    }

    @PostMapping("/{intentId}/owner-reject")
    public ApiResponse<Void> ownerRejectManualBooking(
            @PathVariable UUID intentId
    ) {
        bookingIntentService.ownerRejectManualBooking(intentId);
        return ApiResponse.<Void>builder()
                .message("Đã từ chối yêu cầu đặt sân")
                .build();
    }

    @PostMapping(
            value = "/{intentId}/payment-proof",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> uploadIntentPaymentProof(
            @PathVariable UUID intentId,
            @RequestParam("image") MultipartFile image
    ) {
        return ApiResponse.success(
                bookingIntentService.uploadIntentPaymentProof(intentId, image));
    }

    @PostMapping
    public ApiResponse<BookingIntentResponse> createIntent(
            @Valid @RequestBody BookingRequest request
    ) {
        return ApiResponse.success(
                200,
                "Create booking intent successfully",
                bookingIntentService.createBookingIntent(request));
    }

    @GetMapping("/{intentId}")
    public ApiResponse<BookingIntentResponse> getBookingIntentById(
            @PathVariable UUID intentId
    ) {
        return ApiResponse.success(
                200,
                "Get booking intent successfully",
                bookingIntentService.getBookingIntentById(intentId));
    }
}