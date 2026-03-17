package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.request.booking.UpdateBookingRequest;
import org.sport.backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/bookings")
@Tag(name = "10. Booking")
public class BookingController {

    @Autowired
    private BookingService bookingService;

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
                bookingService.confirmBooking(intentId)
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
            @RequestBody UpdateBookingRequest request
    ) {
        try {

            return ApiResponse.builder()
                    .code(200)
                    .message("Update booking successfully")
                    .result(bookingService.updateBooking(bookingId, request))
                    .build();

        } catch (Exception e) {

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
