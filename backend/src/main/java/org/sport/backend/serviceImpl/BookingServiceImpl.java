package org.sport.backend.serviceImpl;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.*;
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
import org.sport.backend.service.CourtCopyService;
import org.sport.backend.service.CourtService;
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
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

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
    @Autowired
    private CourtCopyService courtCopyService;
    @Autowired
    private CourtPriceRepository courtPriceRepository;
     @Autowired
     private PaymentRepository paymentRepository;

    @Override
    @Transactional
    public BookingIntentResponse createBookingIntent(BookingRequest request) {

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }
        System.err.println("User name " + user.getUserName());
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


            for (CourtCopy courtCopy : selectedCopies) {

                if (rentalArea == null) {
                    rentalArea = courtCopy.getCourt().getRentalArea();
                } else if (!rentalArea.getRentalAreaId()
                        .equals(courtCopy.getCourt().getRentalArea().getRentalAreaId())) {
                    throw new RuntimeException("Tất cả sân phải thuộc cùng một khu vực");
                }


                BigDecimal price = calculateSlotPrice(
                        courtCopy.getCourt(),
                        slotReq.getStartTime(),
                        slotReq.getEndTime()
                );

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

    private BigDecimal calculateSlotPrice(Court court, LocalDateTime start, LocalDateTime end) {

        BigDecimal total = BigDecimal.ZERO;
        LocalDateTime cursor = start;

        while (cursor.isBefore(end)) {

            List<CourtPrice> rules = courtPriceRepository.findAllMatchingRules(
                    court.getCourtId(),
                    cursor.toLocalTime(),
                    cursor.toLocalDate()
            );

            CourtPrice rule = pickBestRule(rules, cursor);

            // Tính điểm kết thúc của rule hiện tại
            LocalDateTime ruleEnd = LocalDateTime.of(cursor.toLocalDate(), rule.getEndTime());

            if (rule.getEndTime().equals(LocalTime.MIN)) {
                ruleEnd = ruleEnd.plusDays(1);
            }

            LocalDateTime stepEnd = ruleEnd.isAfter(end) ? end : ruleEnd;

            long minutes = Duration.between(cursor, stepEnd).toMinutes();

            if (minutes > 0) {
                BigDecimal hours = BigDecimal.valueOf(minutes)
                        .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);

                BigDecimal price = hours.multiply(rule.getPricePerHour());
                total = total.add(price);
            }

            // DEBUG (rất nên giữ)
            System.out.println(
                    "[PRICE] " + cursor +
                            " -> " + stepEnd +
                            " | " + rule.getPriceType() +
                            " | " + rule.getPricePerHour()
            );

            cursor = stepEnd;
        }

        return total;
    }

    private CourtPrice pickBestRule(List<CourtPrice> rules, LocalDateTime time) {

        boolean isWeekend = time.getDayOfWeek() == DayOfWeek.SATURDAY
                || time.getDayOfWeek() == DayOfWeek.SUNDAY;

        return rules.stream()
                .filter(r -> getPriorityScore(r, isWeekend) > 0)
                .max(Comparator
                        .comparing((CourtPrice r) -> getPriorityScore(r, isWeekend))
                        .thenComparing(
                                CourtPrice::getPriority,
                                Comparator.nullsLast(Integer::compareTo)
                        )
                        .thenComparing(
                                CourtPrice::getStartTime,
                                Comparator.reverseOrder()
                        )
                )
                .orElseThrow(() -> new RuntimeException("Không có rule phù hợp"));
    }
    private int getPriorityScore(CourtPrice p, boolean isWeekend) {

        // specific date luôn cao nhất
        if (p.getSpecificDate() != null) return 1000;

        return switch (p.getPriceType()) {
            case EVENT -> 900;
            case HOLIDAY -> 800;
            case WEEKEND -> isWeekend ? 700 : -1;
            case PEAK -> 600;
            case NORMAL -> 500;
            default -> 0;
        };
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
    public BookingResponse confirmBooking(UUID bookingIntentId,Payment payment) {

        BookingIntent intent = bookingIntentRepository
                .findById(bookingIntentId)
                .orElseThrow();

        if (intent.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Hold expired");
        }
        BigDecimal totalPrice = intent.getPreviewPrice();
        BigDecimal paidAmount = payment.getAmount(); // Lấy số tiền thực tế từ Payment (có thể là 30% cọc hoặc 100%)
        BigDecimal remainingAmount = totalPrice.subtract(paidAmount);
        Booking booking = Booking.builder()
                .bookingStatus(BookingStatus.BOOKED)
                .renter(intent.getUser() != null ? intent.getUser() : null)
                .bookerName(intent.getBookerName())
                .bookerPhone(intent.getBookerPhone())
                .depositAmount(paidAmount)           //  Lưu tiền cọc
                .remainingAmount(remainingAmount)// Lưu tiền còn nợ
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
        bookingIntentRepository.save(intent);
        return BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .totalPrice(booking.getTotalPrice())
                .bookingStatus(booking.getBookingStatus())
                 .depositAmount(booking.getDepositAmount())
                 .remainingAmount(booking.getRemainingAmount())
                .slots(slotResponses)
                .createdAt(booking.getCreatedAt())
                .build();
    }

    @Override
    public BookingResponse getBookingById(UUID bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        Optional<Payment> payment = paymentRepository
                .findFirstByBookingOrderByTransactionDateDesc(booking);

        String paymentMethod = null;
        if(payment.isPresent()) {
            paymentMethod = payment.get().getPaymentMethod().toString();
        }
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
                .invoicePdfUrl(booking.getInvoiceUrl())
                .rentalArea(
                        RentalAreaResponse.builder()
                                .rentalAreaId(booking.getRentalArea().getRentalAreaId())
                                .rentalAreaName(booking.getRentalArea().getRentalAreaName())
                                .address(booking.getRentalArea().getAddress())
                                .build()
                )
                .depositAmount(booking.getDepositAmount())
                .remainingAmount(booking.getRemainingAmount())
                .paymentMethod(paymentMethod)
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

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(
                Sort.Order.desc("updatedAt"),
                Sort.Order.desc("createdAt")
        ).descending());

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
        Optional<Payment> payment = paymentRepository
                .findFirstByBookingOrderByTransactionDateDesc(booking);

        String paymentMethod = null;
        if(payment.isPresent()) {
            paymentMethod = payment.get().getPaymentMethod().toString();
        }else{
            paymentMethod = "không có";
        }

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

        BookingResponse bookingResponse = BookingResponse.builder()
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
                .rentalArea(booking.getRentalArea() != null ?
                        RentalAreaResponse.builder()
                                .rentalAreaId(booking.getRentalArea().getRentalAreaId())
                                .rentalAreaName(booking.getRentalArea().getRentalAreaName())
                                .address(booking.getRentalArea().getAddress())
                                .build() : null)
                .depositAmount(booking.getDepositAmount())
                .remainingAmount(booking.getRemainingAmount())
                .paymentMethod(paymentMethod)
                .build();




        return bookingResponse;
    }

    @Override
    @Transactional
    public BookingResponse updateBooking(UUID bookingId, UpdateBookingRequest request) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking không tồn tại"));

        updateBookingInfo(booking, request);

        if (request.getSlots() != null && !request.getSlots().isEmpty()) {
            updateSlots(request.getSlots());
        }

        recalculateBookingSummary(booking);

        bookingRepository.save(booking);

        return mapToResponse(booking);
    }
    private void updateBookingInfo(Booking booking, UpdateBookingRequest request) {

        if (request.getBookerName() != null) {
            booking.setBookerName(request.getBookerName());
        }

        if (request.getBookerPhone() != null) {
            booking.setBookerPhone(request.getBookerPhone());
        }

        if (request.getNote() != null) {
            booking.setNote(request.getNote());
        }

        if (request.getBookingStatus() != null) {
            booking.setBookingStatus(request.getBookingStatus());
            syncSlotStatus(booking, request.getBookingStatus());
        }
    }
    private void updateSlots(List<UpdateSlotRequest> slotRequests) {

        for (UpdateSlotRequest slotReq : slotRequests) {

            Slot slot = slotRepository.findById(slotReq.getSlotId())
                    .orElseThrow(() -> new RuntimeException("Slot không tồn tại"));

            LocalDateTime newStart = slotReq.getStartTime() != null
                    ? slotReq.getStartTime()
                    : slot.getStartTime();

            LocalDateTime newEnd = slotReq.getEndTime() != null
                    ? slotReq.getEndTime()
                    : slot.getEndTime();

            validateSlotLogic(newStart, newEnd, slot.getStartTime());

            CourtCopy targetCopy = resolveCourtCopy(slot, slotReq, newStart, newEnd);

            slot.setStartTime(newStart);
            slot.setEndTime(newEnd);
            slot.setCourtCopy(targetCopy);

            updateSlotPrice(slot, targetCopy, newStart, newEnd);

            slotRepository.save(slot);
        }
    }
    private CourtCopy resolveCourtCopy(
            Slot slot,
            UpdateSlotRequest slotReq,
            LocalDateTime newStart,
            LocalDateTime newEnd) {

        CourtCopy targetCopy;

        if (slotReq.getCourtCopyId() != null) {

            targetCopy = courtCopyRepository.findById(slotReq.getCourtCopyId())
                    .orElseThrow(() -> new RuntimeException("Court copy không tồn tại"));

        } else {
            targetCopy = slot.getCourtCopy();
        }

        boolean available = courtCopyService.checkAvailability(
                targetCopy.getCourtCopyId(),
                newStart,
                newEnd,
                slot.getSlotId()
        );

        if (available) return targetCopy;

        Court court = targetCopy.getCourt();

        List<CourtCopy> availableCopies =
                courtCopyRepository.findAvailableCourtCopy(
                        court.getCourtId(),
                        newStart,
                        newEnd
                );

        if (availableCopies.isEmpty()) {
            throw new RuntimeException("Không có sân trống trong khung giờ này");
        }

        return availableCopies.get(0);
    }

    private void updateSlotPrice(
            Slot slot,
            CourtCopy courtCopy,
            LocalDateTime start,
            LocalDateTime end) {

        BigDecimal hours = BigDecimal.valueOf(
                Duration.between(start, end).toMinutes()
        ).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

//        slot.setPrice(
//                courtCopy.getCourt().getPrice().multiply(hours)
//        );
    }
    private void validateSlotLogic(LocalDateTime start, LocalDateTime end, LocalDateTime oldStart) {

        if (start == null || end == null)
            throw new RuntimeException("Thời gian không hợp lệ");

        if (start.isAfter(end))
            throw new RuntimeException("Start phải trước end");

        if (!start.equals(oldStart) && start.isBefore(LocalDateTime.now()))
            throw new RuntimeException("Không thể đặt thời gian trong quá khứ");

        if (start.getMinute() % 30 != 0 || end.getMinute() % 30 != 0)
            throw new RuntimeException("Thời gian phải theo mốc 30 phút");

        if (Duration.between(start, end).toMinutes() < 60)
            throw new RuntimeException("Thời gian thuê ít nhất là hơn 1 tiếng");
    }

    private void syncSlotStatus(Booking booking, BookingStatus status) {
        SlotStatus slotStatus = null;
        if (status == BookingStatus.CANCELLED) slotStatus = SlotStatus.CANCELLED;
        else if (status == BookingStatus.COMPLETED) slotStatus = SlotStatus.COMPLETED;

        if (slotStatus != null) {
            for (Slot s : booking.getSlots()) s.setSlotStatus(slotStatus);
        }
    }

    private void recalculateBookingSummary(Booking booking) {
        BigDecimal total = booking.getSlots().stream().map(Slot::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDateTime minStart = booking.getSlots().stream().map(Slot::getStartTime).min(LocalDateTime::compareTo).orElse(null);
        LocalDateTime maxEnd = booking.getSlots().stream().map(Slot::getEndTime).max(LocalDateTime::compareTo).orElse(null);

        booking.setTotalPrice(total);
        booking.setStartTime(minStart);
        booking.setEndTime(maxEnd);
                // Recalculate remaining amount based on existing deposit
                BigDecimal deposit = booking.getDepositAmount() == null ? BigDecimal.ZERO : booking.getDepositAmount();
                booking.setRemainingAmount(total.subtract(deposit));
    }

        @Override
        public String generateInvoiceUrl(UUID bookingId, String invoiceViewUrl) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                booking.setInvoiceUrl(invoiceViewUrl);
                bookingRepository.save(booking);
                return invoiceViewUrl;
        }
        @Override
    @Transactional
    public void collectRemainingPayment(UUID bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Booking với ID: " + bookingId));

        if (booking.getRemainingAmount() != null && booking.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Đơn hàng này đã được thanh toán đủ!");
        }
        booking.setRemainingAmount(BigDecimal.ZERO);
        booking.setDepositAmount(booking.getTotalPrice());;

         if (booking.getBookingStatus() == BookingStatus.BOOKED) {
             booking.setBookingStatus(BookingStatus.COMPLETED);
         }

        bookingRepository.save(booking);
    }
}
