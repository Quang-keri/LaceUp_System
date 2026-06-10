package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.booking.JoinSharedBookingRequest;
import org.sport.backend.dto.response.booking.BookingParticipantResponse;
import org.sport.backend.service.SharedBookingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/bookings/shared")
@RequiredArgsConstructor
@Tag(
        name = "10.3 Shared Match (Trận vãng lai)",
        description = "Các API phục vụ chức năng tham gia và thanh toán vé lẻ"
)
public class SharedBookingController {

    private final SharedBookingService sharedBookingService;

    @PostMapping("/{bookingId}/join")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingParticipantResponse>> joinMatch(
            @PathVariable UUID bookingId,
            @Valid @RequestBody JoinSharedBookingRequest request
    ) {
        try {
            BookingParticipantResponse result =
                    sharedBookingService.joinSharedBooking(
                            bookingId,
                            request.getQuantity()
                    );

            return ResponseEntity.ok(
                    ApiResponse.success(
                            200,
                            "Đặt chỗ thành công hoặc tiếp tục thanh toán vé đang chờ.",
                            result
                    )
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            ApiResponse.error(
                                    400,
                                    e.getMessage()
                            )
                    );
        }
    }

    @PutMapping("/ticket/{participantId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingParticipantResponse>> cancelTicketByUser(
            @PathVariable UUID participantId
    ) {
        try {
            return ResponseEntity.ok(
                    ApiResponse.success(
                            200,
                            "Hủy vé thành công. Tiền sẽ không được hoàn lại theo quy định hệ thống.",
                            sharedBookingService
                                    .cancelSharedTicketByUser(
                                            participantId
                                    )
                    )
            );
        } catch (Exception exception) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            ApiResponse.error(
                                    400,
                                    exception.getMessage()
                            )
                    );
        }
    }

    @GetMapping("/ticket/{participantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingParticipantResponse>> getTicketParticipant(
            @PathVariable UUID participantId
    ) {
        try {
            return ResponseEntity.ok(
                    ApiResponse.success(
                            200,
                            "Lấy thông tin vé thành công",
                            sharedBookingService
                                    .getTicketParticipant(participantId)
                    )
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            ApiResponse.error(
                                    400,
                                    e.getMessage()
                            )
                    );
        }
    }

    @PostMapping(
            value = "/ticket/{participantId}/payment-proof",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingParticipantResponse>>
    uploadTicketPaymentProof(
            @PathVariable UUID participantId,
            @RequestPart("image") MultipartFile image
    ) {
        try {
            return ResponseEntity.ok(
                    ApiResponse.success(
                            200,
                            "Tải biên lai thanh toán vé lên thành công",
                            sharedBookingService
                                    .uploadTicketPaymentProof(
                                            participantId,
                                            image
                                    )
                    )
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            ApiResponse.error(
                                    400,
                                    e.getMessage()
                            )
                    );
        }
    }

    @GetMapping("/owner/pending-tickets")
    @PreAuthorize("hasAuthority('MANAGE_BOOKING')")
    public ResponseEntity<ApiResponse<PageResponse<BookingParticipantResponse>>> getPendingTickets(
            @RequestParam UUID rentalAreaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                200,
                "Thành công",
                sharedBookingService.getPendingTicketsForOwner(rentalAreaId, from, to, page, size)));
    }

    @PutMapping("/ticket/{participantId}/confirm")
    @PreAuthorize("hasAuthority('MANAGE_BOOKING')")
    public ResponseEntity<ApiResponse<Void>> confirmTicketPayment(
            @PathVariable UUID participantId,
            @RequestParam boolean isApproved
    ) {
        try {
            sharedBookingService.confirmSharedTicketPayment(participantId, isApproved);
            String msg = isApproved ? "Đã duyệt thanh toán vé thành công" : "Đã từ chối thanh toán vé";
            return ResponseEntity.ok(ApiResponse.success(
                    200,
                    msg,
                    null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            400,
                            e.getMessage()));
        }
    }
}
