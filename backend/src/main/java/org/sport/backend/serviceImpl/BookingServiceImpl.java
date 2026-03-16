package org.sport.backend.serviceImpl;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.constant.BookingStatus;
import org.sport.backend.constant.CourtCopyStatus;
import org.sport.backend.constant.SlotStatus;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.request.booking.UpdateBookingRequest;
import org.sport.backend.dto.request.slot.SlotRequest;
import org.sport.backend.dto.request.slot.UpdateSlotRequest;
import org.sport.backend.dto.response.booking.BookingIntentResponse;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.rental.RentalAreaResponse;
import org.sport.backend.dto.response.slot.IntentSlotResponse;
import org.sport.backend.dto.response.slot.SlotResponse;
import org.sport.backend.entity.*;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.*;
import org.sport.backend.service.BookingService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.BookingSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BookingServiceImpl implements BookingService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingIntentRepository bookingIntentRepository;
    @Autowired
    private CourtRepository courtRepository;

    @Autowired
    private CourtCopyRepository courtCopyRepository;
    @Autowired
    private SlotRepository slotRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private UserService userService;

    @Override
    @Transactional
    public BookingIntentResponse createBookingIntent(BookingRequest request) {

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }

        BookingIntent intent = BookingIntent.builder()
                .user(user)
                .bookerName(request.getUserName())
                .bookerPhone(request.getUserPhone())
                .status(BookingIntentStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .note(request.getNote())
                .build();

        List<IntentSlot> intentSlots = new ArrayList<>();
        BigDecimal totalPrice = BigDecimal.ZERO;
        RentalArea rentalArea = null;

        for (SlotRequest slotReq : request.getSlotRequests()) {

            List<CourtCopy> selectedCopies = new ArrayList<>();


            if (slotReq.getCourtCopyId() != null) {

                CourtCopy copy = courtCopyRepository.findById(slotReq.getCourtCopyId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy sân"));

                selectedCopies.add(copy);

            } else if (slotReq.getCourtId() != null) {

                int quantity = slotReq.getQuantity() == null ? 1 : slotReq.getQuantity();

                List<CourtCopy> copies = courtCopyRepository
                        .findByCourt_CourtIdAndCourtCopyStatus(slotReq.getCourtId(), CourtCopyStatus.ACTIVE);

                if (copies.isEmpty()) {
                    throw new RuntimeException("Không có sân khả dụng");
                }

                List<CourtCopy> availableCopies = copies.stream()
                        .filter(copy -> {

                            List<Slot> conflicts = slotRepository.findConflictSlot(
                                    copy.getCourtCopyId(),
                                    slotReq.getStartTime(),
                                    slotReq.getEndTime()
                            );

                            return conflicts.isEmpty();

                        })
                        .limit(quantity)
                        .toList();

                if (availableCopies.size() < quantity) {
                    throw new RuntimeException("Không đủ sân trống cho số lượng yêu cầu");
                }

                selectedCopies.addAll(availableCopies);

            } else {
                throw new RuntimeException("Phải cung cấp courtId hoặc courtCopyId");
            }

            /**
             * tạo slot cho từng courtCopy
             */
            for (CourtCopy courtCopy : selectedCopies) {

                if (rentalArea == null) {
                    rentalArea = courtCopy.getCourt().getRentalArea();
                } else if (!rentalArea.getRentalAreaId()
                        .equals(courtCopy.getCourt().getRentalArea().getRentalAreaId())) {
                    throw new RuntimeException("Tất cả sân phải thuộc cùng một khu vực");
                }

                long minutes = Duration
                        .between(slotReq.getStartTime(), slotReq.getEndTime())
                        .toMinutes();

                BigDecimal hours = BigDecimal
                        .valueOf(minutes)
                        .divide(BigDecimal.valueOf(60));

                BigDecimal price = courtCopy
                        .getCourt()
                        .getPrice()
                        .multiply(hours);

                totalPrice = totalPrice.add(price);

                IntentSlot intentSlot = IntentSlot.builder()
                        .bookingIntent(intent)
                        .courtCopy(courtCopy)
                        .startTime(slotReq.getStartTime())
                        .endTime(slotReq.getEndTime())
                        .price(price)
                        .build();

                intentSlots.add(intentSlot);
            }
        }

        LocalDateTime start = intentSlots.stream()
                .map(IntentSlot::getStartTime)
                .min(LocalDateTime::compareTo)
                .orElse(null);

        LocalDateTime end = intentSlots.stream()
                .map(IntentSlot::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        intent.setStartTime(start);
        intent.setEndTime(end);
        intent.setSlots(intentSlots);
        intent.setPreviewPrice(totalPrice);
        intent.setRentalArea(rentalArea);

        bookingIntentRepository.save(intent);

        List<IntentSlotResponse> slotResponses = intentSlots.stream()
                .map(slot -> IntentSlotResponse.builder()
                        .courtCopyId(slot.getCourtCopy().getCourtCopyId())
                        .courtCode(slot.getCourtCopy().getCourtCode())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .price(slot.getPrice())
                        .build())
                .toList();

        return BookingIntentResponse.builder()
                .bookingIntentId(intent.getBookingIntentId())
                .previewPrice(totalPrice)
                .expiresAt(intent.getExpiresAt())
                .status(intent.getStatus())
                .slots(slotResponses)
                .build();
    }

    @Override
    public BookingIntentResponse getBookingIntentById(UUID bookingIntentId) {

        BookingIntent bookingIntent = bookingIntentRepository.findById(bookingIntentId)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy mã đặt lịch dự định với id " + bookingIntentId));

        List<IntentSlotResponse> intentSlotResponses =
                bookingIntent.getSlots().stream().map(intentSlot -> {

                    CourtCopy courtCopy = intentSlot.getCourtCopy();

                    return IntentSlotResponse.builder()
                            .intentSlotId(intentSlot.getIntentSlotId())
                            .courtCopyId(courtCopy.getCourtCopyId())
                            .courtCode(courtCopy.getCourtCode())
                            .startTime(intentSlot.getStartTime())
                            .endTime(intentSlot.getEndTime())
                            .price(intentSlot.getPrice())
                            .build();

                }).toList();

        BigDecimal tax = BigDecimal.ZERO;


        BigDecimal discount = BigDecimal.ZERO;


        BigDecimal totalPrice = bookingIntent.getPreviewPrice()
                .add(tax)
                .subtract(discount);

        return BookingIntentResponse.builder()
                .bookingIntentId(bookingIntent.getBookingIntentId())
                .previewPrice(bookingIntent.getPreviewPrice())
                .tax(tax)
                .discount(discount)
                .totalAmount(totalPrice)
                .status(bookingIntent.getStatus())
                .expiresAt(bookingIntent.getExpiresAt())
                .title(bookingIntent.getTitle())
                .note(bookingIntent.getNote())
                .bookerName(bookingIntent.getBookerName())
                .bookerPhone(bookingIntent.getBookerPhone())
                .startTime(bookingIntent.getStartTime())
                .endTime(bookingIntent.getEndTime())
                .slots(intentSlotResponses)

                .build();
    }

    @Override
    @Transactional
    public BookingResponse confirmBooking(UUID bookingIntentId) {

        BookingIntent intent = bookingIntentRepository
                .findById(bookingIntentId)
                .orElseThrow();

        if (intent.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Hold expired");
        }

        Booking booking = Booking.builder()
                .bookingStatus(BookingStatus.BOOKED)
                .renter(intent.getUser() != null ? intent.getUser() : null)
                .bookerName(intent.getBookerName())
                .bookerPhone(intent.getBookerPhone())
                .totalPrice(intent.getPreviewPrice())
                .startTime(intent.getStartTime())
                .endTime(intent.getEndTime())
                .note(intent.getNote())
                .rentalArea(intent.getRentalArea())
                .createdAt(LocalDateTime.now())
                .build();

        bookingRepository.save(booking);

        List<SlotResponse> slotResponses = new ArrayList<>();

        for (IntentSlot intentSlot : intent.getSlots()) {

            Slot slot = Slot.builder()
                    .booking(booking)
                    .courtCopy(intentSlot.getCourtCopy())
                    .startTime(intentSlot.getStartTime())
                    .endTime(intentSlot.getEndTime())
                    .price(intentSlot.getPrice())
                    .slotStatus(SlotStatus.BOOKED)
                    .build();

            slotRepository.save(slot);

            slotResponses.add(
                    SlotResponse.builder()
                            .slotId(slot.getSlotId())
                            .courtCopyId(slot.getCourtCopy().getCourtCopyId())
                            .courtCode(slot.getCourtCopy().getCourtCode())
                            .startTime(slot.getStartTime())
                            .endTime(slot.getEndTime())
                            .price(slot.getPrice())
                            .slotStatus(slot.getSlotStatus())
                            .build()
            );
        }

        intent.setStatus(BookingIntentStatus.CONFIRMED);

        return BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .totalPrice(booking.getTotalPrice())
                .bookingStatus(booking.getBookingStatus())
                .slots(slotResponses)
                .createdAt(booking.getCreatedAt())
                .build();
    }

    @Override
    public BookingResponse getBookingById(UUID bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        List<Slot> slots = booking.getSlots();

        List<SlotResponse> slotResponses = slots.stream()
                .map(slot -> SlotResponse.builder()
                        .slotId(slot.getSlotId())
                        .courtCopyId(slot.getCourtCopy().getCourtCopyId())
                        .courtCode(slot.getCourtCopy().getCourtCode())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .price(slot.getPrice())
                        .slotStatus(slot.getSlotStatus())
                        .build())
                .toList();

        return BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .totalPrice(booking.getTotalPrice())
                .bookingStatus(booking.getBookingStatus())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .slots(slotResponses)
                .createdAt(booking.getCreatedAt())
                .userName(booking.getBookerName())
                .phoneNumber(booking.getBookerPhone())
                .note(booking.getNote())
                .invoicePdfUrl(null)
                .rentalArea(
                        RentalAreaResponse.builder()
                                .rentalAreaId(booking.getRentalArea().getRentalAreaId())
                                .rentalAreaName(booking.getRentalArea().getRentalAreaName())
                                .address(booking.getRentalArea().getAddress())
                                .build()
                )
                .build();
    }

    @Override
    public PageResponse<BookingResponse> getBookingsRentalId(
            UUID rentalId,
            BookingStatus bookingStatus,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        Specification<Booking> spec = BookingSpecification.filterBooking(
                rentalId,
                null,
                bookingStatus,
                keyword,
                from,
                to
        );

        Page<Booking> bookingPage = bookingRepository.findAll(spec, pageable);

        List<BookingResponse> responses = bookingPage.getContent()
                .stream()
                .map(this::mapToResponse)
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
    public PageResponse<BookingResponse> getMyBookings(
            UUID userId,
            BookingStatus bookingStatus,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        Specification<Booking> spec = BookingSpecification.filterBooking(
                null,
                userId,
                bookingStatus,
                keyword,
                from,
                to
        );

        Page<Booking> bookingPage = bookingRepository.findAll(spec, pageable);

        List<BookingResponse> responses = bookingPage.getContent()
                .stream()
                .map(this::mapToResponse)
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
                keyword,
                from,
                to
        );

        Page<Booking> bookingPage = bookingRepository.findAll(spec, pageable);

        List<BookingResponse> responses = bookingPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<BookingResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(bookingPage.getTotalPages())
                .totalElements(bookingPage.getTotalElements())
                .data(responses)
                .build();
    }

    private BookingResponse mapToResponse(Booking booking) {

        List<SlotResponse> slots = booking.getSlots()
                .stream()
                .map(slot -> SlotResponse.builder()
                        .slotId(slot.getSlotId())
                        .courtCopyId(slot.getCourtCopy().getCourtCopyId())
                        .courtCode(slot.getCourtCopy().getCourtCode())
                        .startTime(slot.getStartTime())
                        .endTime(slot.getEndTime())
                        .price(slot.getPrice())
                        .slotStatus(slot.getSlotStatus())
                        .build())
                .toList();

        return BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .totalPrice(booking.getTotalPrice())
                .bookingStatus(booking.getBookingStatus())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .createdAt(booking.getCreatedAt())
                .slots(slots)
                .userName(booking.getBookerName())
                .phoneNumber(booking.getBookerPhone())
                .note(booking.getNote())
                .build();
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(UUID bookingId, UpdateBookingRequest request) {
        System.err.println("zô day update");
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));


        if (request.getBookerName() != null) {
            booking.setBookerName(request.getBookerName());
        }


        if (request.getBookerPhone() != null) {
            booking.setBookerPhone(request.getBookerPhone());
        }


        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }
        System.err.println("zô day update staus nha em nhé");

        if (request.getBookingStatus() != null) {

            booking.setBookingStatus(request.getBookingStatus());
            System.err.println("booking status update " + request.getBookingStatus());
            if (request.getBookingStatus() == BookingStatus.CANCELLED) {
                for (Slot slot : booking.getSlots()) {
                    slot.setSlotStatus(SlotStatus.CANCELLED);
                }
            }

            if (request.getBookingStatus() == BookingStatus.COMPLETED) {
                for (Slot slot : booking.getSlots()) {
                    slot.setSlotStatus(SlotStatus.COMPLETED);
                }
            }
        } else {
            System.err.println("em ấy ko vô udpate status");
        }


        if (request.getSlots() != null && !request.getSlots().isEmpty()) {

            for (UpdateSlotRequest slotReq : request.getSlots()) {

                Slot slot = slotRepository.findById(slotReq.getSlotId())
                        .orElseThrow(() -> new RuntimeException("khung giờ không tìm thấy"));

                LocalDateTime newStart = slotReq.getStartTime();
                LocalDateTime newEnd = slotReq.getEndTime();

                Court court = slot.getCourtCopy().getCourt();

                List<CourtCopy> availableCourtCopies =
                        courtCopyRepository.findAvailableCourtCopy(
                                court.getCourtId(),
                                newStart,
                                newEnd
                        );

                if (availableCourtCopies.isEmpty()) {
                    throw new RuntimeException("Không có sân trống trong khung giờ này");
                }

                CourtCopy newCourtCopy = availableCourtCopies.get(0);

                slot.setStartTime(newStart);
                slot.setEndTime(newEnd);
                slot.setCourtCopy(newCourtCopy);

                long minutes = Duration.between(newStart, newEnd).toMinutes();
                BigDecimal hours = BigDecimal.valueOf(minutes)
                        .divide(BigDecimal.valueOf(60));

                BigDecimal price = court.getPrice().multiply(hours);

                slot.setPrice(price);

                slotRepository.save(slot);
            }
        }


        BigDecimal totalPrice = booking.getSlots()
                .stream()
                .map(Slot::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        booking.setTotalPrice(totalPrice);


        LocalDateTime start = booking.getSlots()
                .stream()
                .map(Slot::getStartTime)
                .min(LocalDateTime::compareTo)
                .orElse(null);

        LocalDateTime end = booking.getSlots()
                .stream()
                .map(Slot::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        booking.setStartTime(start);
        booking.setEndTime(end);

        bookingRepository.save(booking);

        return mapToResponse(booking);
    }
}
