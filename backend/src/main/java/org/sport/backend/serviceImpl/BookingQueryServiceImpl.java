package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.BookingType;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.booking.SharedBookingPublicResponse;
import org.sport.backend.dto.response.rental.RentalAreaResponse;
import org.sport.backend.dto.response.slot.SlotResponse;
import org.sport.backend.entity.Booking;
import org.sport.backend.entity.Payment;
import org.sport.backend.mapper.AddressMapper;
import org.sport.backend.mapper.BookingMapper;
import org.sport.backend.repository.BookingParticipantRepository;
import org.sport.backend.repository.BookingRepository;
import org.sport.backend.repository.BookingServiceItemRepository;
import org.sport.backend.repository.PaymentRepository;
import org.sport.backend.service.BookingQueryService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.BookingSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingQueryServiceImpl implements BookingQueryService {

    private final BookingRepository bookingRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final PaymentRepository paymentRepository;
    private final BookingParticipantRepository bookingParticipantRepository;

    private final UserService userService;

    private final AddressMapper addressMapper;
    private final BookingMapper bookingMapper;

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(UUID bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking"));

        Optional<Payment> latestPayment =
                paymentRepository.findFirstByBookingOrderByTransactionDateDesc(
                        booking
                );

        String paymentMethod = latestPayment
                .map(Payment::getPaymentMethod)
                .map(Enum::name)
                .orElse(null);

        List<SlotResponse> slotResponses =
                Optional.ofNullable(booking.getSlots())
                        .orElse(List.of())
                        .stream()
                        .map(slot -> SlotResponse.builder()
                                .slotId(slot.getSlotId())
                                .courtCopyId(
                                        slot.getCourtCopy() != null
                                                ? slot.getCourtCopy().getCourtCopyId()
                                                : null
                                )
                                .courtCode(
                                        slot.getCourtCopy() != null
                                                ? slot.getCourtCopy().getCourtCode()
                                                : null
                                )
                                .courtName(
                                        slot.getCourtCopy() != null
                                                && slot.getCourtCopy().getCourt() != null
                                                ? slot.getCourtCopy()
                                                .getCourt()
                                                .getCourtName()
                                                : null
                                )
                                .startTime(slot.getStartTime())
                                .endTime(slot.getEndTime())
                                .price(slot.getPrice())
                                .slotStatus(slot.getSlotStatus())
                                .build())
                        .toList();

        List<BookingResponse.BookingServiceResponse> extraServiceResponses =
                bookingServiceItemRepository.findByBooking(booking)
                        .stream()
                        .map(item ->
                                BookingResponse.BookingServiceResponse.builder()
                                        .serviceId(
                                                item.getServiceItem() != null
                                                        ? item.getServiceItem()
                                                        .getServiceItemId()
                                                        : null
                                        )
                                        .serviceName(
                                                item.getServiceItem() != null
                                                        ? item.getServiceItem()
                                                        .getServiceName()
                                                        : null
                                        )
                                        .quantity(item.getQuantity())
                                        .price(item.getPrice())
                                        .build()
                        )
                        .toList();

        RentalAreaResponse rentalAreaResponse = null;

        if (booking.getRentalArea() != null) {
            rentalAreaResponse = RentalAreaResponse.builder()
                    .rentalAreaId(
                            booking.getRentalArea().getRentalAreaId()
                    )
                    .rentalAreaName(
                            booking.getRentalArea().getRentalAreaName()
                    )
                    .address(
                            booking.getRentalArea().getAddress() != null
                                    ? addressMapper.toAddressResponse(
                                    booking.getRentalArea().getAddress()
                            )
                                    : null
                    )
                    .contactPhone(
                            booking.getRentalArea().getContactPhone()
                    )
                    .build();
        }

        BookingResponse response = BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .totalPrice(booking.getTotalPrice())
                .bookingStatus(booking.getBookingStatus())
                .status(booking.getBookingStatus())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .slots(slotResponses)
                .createdAt(booking.getCreatedAt())
                .userName(booking.getBookerName())
                .phoneNumber(booking.getBookerPhone())
                .note(booking.getNote())
                .invoicePdfUrl(booking.getInvoiceUrl())
                .rentalArea(rentalAreaResponse)
                .depositAmount(booking.getDepositAmount())
                .remainingAmount(booking.getRemainingAmount())
                .paymentMethod(paymentMethod)
                .extraServiceResponses(extraServiceResponses)

                .bookingType(booking.getBookingType())
                .maxParticipants(booking.getMaxParticipants())
                .minParticipants(booking.getMinParticipants())
                .minimumCheckCompleted(booking.getMinimumCheckCompleted())
                .minimumCheckedAt(booking.getMinimumCheckedAt())
                .currentParticipants(
                        booking.getCurrentParticipants() != null
                                ? booking.getCurrentParticipants()
                                : 0
                )
                .pricePerTicket(booking.getPricePerTicket())
                .build();

        attachSharedBookingFinancialSummary(
                response,
                booking
        );

        UUID currentUserId = userService
                .getCurrentUserEntity()
                .getUserId();

        attachCurrentUserSharedTicket(
                response,
                booking,
                currentUserId
        );

        return response;
    }

    @Override
    public PageResponse<BookingResponse> getBookingsRentalId(
            UUID rentalId,
            BookingStatus bookingStatus,
            BookingType bookingType,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by(Sort.Direction.DESC, "startTime")
                        .and(Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        Specification<Booking> spec = BookingSpecification.filterBooking(
                rentalId,
                null,
                bookingStatus,
                bookingType,
                keyword,
                from,
                to
        );

        Page<Booking> bookingPage = bookingRepository.findAll(spec, pageable);

        List<BookingResponse> responses = bookingPage.getContent()
                .stream()
                .map(booking -> {
                    BookingResponse response =
                            bookingMapper.toBookingResponse(booking);

                    attachSharedBookingFinancialSummary(
                            response,
                            booking
                    );

                    return response;
                })
                .toList();

        return PageResponse.<BookingResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(bookingPage.getTotalPages())
                .totalElements(bookingPage.getTotalElements())
                .data(responses)
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public SharedBookingPublicResponse getPublicSharedBooking(
            UUID bookingId
    ) {
        Booking booking = bookingRepository
                .findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy lịch vãng lai"
                        )
                );

        if (booking.getBookingType() != BookingType.SHARED) {
            throw new RuntimeException(
                    "Booking này không phải lịch vãng lai"
            );
        }

        long confirmedParticipants =
                bookingParticipantRepository
                        .sumQuantityByBookingIdAndStatuses(
                                bookingId,
                                List.of(PaymentStatus.SUCCESS)
                        );

        long reservedParticipants =
                bookingParticipantRepository
                        .sumQuantityByBookingIdAndStatuses(
                                bookingId,
                                List.of(
                                        PaymentStatus.PENDING,
                                        PaymentStatus.SUCCESS
                                )
                        );

        int maxParticipants =
                booking.getMaxParticipants() != null
                        ? booking.getMaxParticipants()
                        : 0;

        long remainingSlots = Math.max(
                0,
                maxParticipants - reservedParticipants
        );

        var firstSlot = Optional
                .ofNullable(booking.getSlots())
                .orElse(List.of())
                .stream()
                .findFirst()
                .orElse(null);

        return SharedBookingPublicResponse.builder()
                .bookingId(booking.getBookingId())
                .bookingType(booking.getBookingType())
                .pricePerTicket(booking.getPricePerTicket())

                .currentParticipants(
                        confirmedParticipants
                )
                .reservedParticipants(
                        reservedParticipants
                )
                .remainingSlots(
                        remainingSlots
                )

                .maxParticipants(maxParticipants)
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())

                .courtName(
                        firstSlot != null
                                && firstSlot.getCourtCopy() != null
                                && firstSlot.getCourtCopy()
                                .getCourt() != null
                                ? firstSlot
                                .getCourtCopy()
                                .getCourt()
                                .getCourtName()
                                : null
                )

                .courtCode(
                        firstSlot != null
                                && firstSlot.getCourtCopy() != null
                                ? firstSlot
                                .getCourtCopy()
                                .getCourtCode()
                                : null
                )

                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getMyBookings(
            BookingStatus bookingStatus,
            BookingType bookingType,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {
        UUID userId = userService
                .getCurrentUserEntity()
                .getUserId();

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by("createdAt").descending()
        );

        Specification<Booking> spec =
                BookingSpecification.filterMyBookings(
                        userId,
                        bookingStatus,
                        bookingType,
                        keyword,
                        from,
                        to
                );

        Page<Booking> bookingPage =
                bookingRepository.findAll(spec, pageable);

        List<BookingResponse> responses = bookingPage
                .getContent()
                .stream()
                .map(booking -> {
                    BookingResponse response =
                            bookingMapper.toBookingResponse(booking);

                    attachSharedBookingFinancialSummary(
                            response,
                            booking
                    );

                    attachCurrentUserSharedTicket(
                            response,
                            booking,
                            userId
                    );

                    return response;
                })
                .toList();

        return PageResponse.<BookingResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(bookingPage.getTotalPages())
                .totalElements(bookingPage.getTotalElements())
                .data(responses)
                .build();
    }

    @Override
    public PageResponse<BookingResponse> getAllBookings(
            BookingStatus bookingStatus,
            BookingType bookingType,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        Specification<Booking> spec = BookingSpecification.filterBooking(
                null,
                null,
                bookingStatus,
                bookingType,
                keyword,
                from,
                to
        );

        Page<Booking> bookingPage = bookingRepository.findAll(spec, pageable);

        List<BookingResponse> responses = bookingPage.getContent()
                .stream()
                .map(booking -> {
                    BookingResponse response =
                            bookingMapper.toBookingResponse(booking);

                    attachSharedBookingFinancialSummary(
                            response,
                            booking
                    );

                    return response;
                })
                .toList();

        return PageResponse.<BookingResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(bookingPage.getTotalPages())
                .totalElements(bookingPage.getTotalElements())
                .data(responses)
                .build();
    }

    private void attachSharedBookingFinancialSummary(
            BookingResponse response,
            Booking booking
    ) {
        if (response == null
                || booking == null
                || booking.getBookingType() != BookingType.SHARED) {
            return;
        }

        List<PaymentStatus> activePaidStatuses = List.of(
                PaymentStatus.SUCCESS,
                PaymentStatus.BOOKED,
                PaymentStatus.COMPLETED
        );

        BigDecimal activeTicketAmount =
                Optional.ofNullable(
                        bookingParticipantRepository
                                .sumAmountByBookingIdAndStatuses(
                                        booking.getBookingId(),
                                        activePaidStatuses
                                )
                ).orElse(BigDecimal.ZERO);

        BigDecimal cancelledNoRefundAmount =
                Optional.ofNullable(
                        bookingParticipantRepository
                                .sumAmountByBookingIdAndStatuses(
                                        booking.getBookingId(),
                                        List.of(
                                                PaymentStatus.CANCELLED_NO_REFUND
                                        )
                                )
                ).orElse(BigDecimal.ZERO);

        long activeTicketQuantity =
                Optional.ofNullable(
                        bookingParticipantRepository
                                .sumQuantityByBookingIdAndStatuses(
                                        booking.getBookingId(),
                                        activePaidStatuses
                                )
                ).orElse(0L);

        long cancelledNoRefundQuantity =
                Optional.ofNullable(
                        bookingParticipantRepository
                                .sumQuantityByBookingIdAndStatuses(
                                        booking.getBookingId(),
                                        List.of(
                                                PaymentStatus.CANCELLED_NO_REFUND
                                        )
                                )
                ).orElse(0L);

        response.setTicketCollectedAmount(
                activeTicketAmount.add(cancelledNoRefundAmount)
        );
        response.setActiveTicketQuantity(
                Math.toIntExact(activeTicketQuantity)
        );
        response.setCancelledNoRefundQuantity(
                Math.toIntExact(cancelledNoRefundQuantity)
        );
        response.setCancelledNoRefundAmount(
                cancelledNoRefundAmount
        );
    }

    private void attachCurrentUserSharedTicket(
            BookingResponse response,
            Booking booking,
            UUID currentUserId
    ) {
        if (response == null
                || booking == null
                || currentUserId == null
                || booking.getBookingType() != BookingType.SHARED) {
            return;
        }

        bookingParticipantRepository
                .findTopByBooking_BookingIdAndUser_UserIdOrderByCreatedAtDesc(
                        booking.getBookingId(),
                        currentUserId
                )
                .filter(participant ->
                        !Boolean.TRUE.equals(
                                participant.getIsHost()
                        )
                )
                .ifPresent(participant -> {
                    response.setParticipantId(
                            participant.getParticipantId()
                    );

                    response.setTicketQuantity(
                            participant.getQuantity() != null
                                    ? participant.getQuantity()
                                    : 1
                    );

                    response.setTicketAmount(
                            participant.getAmountPaid()
                    );

                    response.setTicketPaymentStatus(
                            participant.getPaymentStatus()
                    );

                    response.setTicketPaymentProofUrl(
                            participant.getPaymentProofUrl()
                    );

                    response.setSharedTicketParticipant(true);

                    paymentRepository
                            .findTopByBookingParticipantOrderByTransactionDateDesc(
                                    participant
                            )
                            .ifPresent(payment -> {
                                response.setTransactionCode(
                                        resolvePaymentTransactionCode(
                                                payment
                                        )
                                );

                                if (payment.getPaymentMethod() != null) {
                                    response.setPaymentMethod(
                                            payment
                                                    .getPaymentMethod()
                                                    .name()
                                    );
                                }
                            });
                });
    }

    private String resolvePaymentTransactionCode(
            Payment payment
    ) {
        if (payment == null) {
            return null;
        }

        if (payment.getTransactionCode() != null
                && !payment.getTransactionCode().isBlank()) {
            return payment
                    .getTransactionCode()
                    .trim();
        }

        if (payment.getOrderCode() != null) {
            String prefix =
                    payment.getPaymentMethod() != null
                            ? payment.getPaymentMethod().name()
                            : "PAYMENT";

            return prefix
                    + "-"
                    + payment.getOrderCode();
        }

        if (payment.getPaymentId() == null) {
            return null;
        }

        return "PAY-"
                + payment.getPaymentId()
                .toString()
                .replace("-", "")
                .substring(0, 12)
                .toUpperCase();
    }

}
