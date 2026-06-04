package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.constant.*;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.request.booking.OwnerBookingRequest;
import org.sport.backend.dto.request.booking.UpdateBookingRequest;
import org.sport.backend.dto.request.serviceItem.AddExtraServicesRequest;
import org.sport.backend.dto.request.slot.SlotRequest;
import org.sport.backend.dto.request.slot.UpdateSlotRequest;
import org.sport.backend.dto.response.booking.BookingIntentResponse;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.rental.RentalAreaResponse;
import org.sport.backend.dto.response.slot.CheckAvailabilityResponse;
import org.sport.backend.dto.response.slot.IntentSlotResponse;
import org.sport.backend.dto.response.slot.SlotResponse;
import org.sport.backend.entity.*;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.mapper.AddressMapper;
import org.sport.backend.mapper.BookingMapper;
import org.sport.backend.repository.*;
import org.sport.backend.service.BookingService;
import org.sport.backend.service.CourtCopyService;
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
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final UserRepository userRepository;
    private final BookingIntentRepository bookingIntentRepository;
    private final CourtRepository courtRepository;
    private final CourtCopyRepository courtCopyRepository;
    private final SlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final BookingServiceItemRepository bookingServiceItemRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final TransactionRepository transactionRepository;
    private final CourtPriceRepository courtPriceRepository;
    private final PaymentRepository paymentRepository;
    private final ReputationLogRepository reputationLogRepository;

    private final UserService userService;
    private final CourtCopyService courtCopyService;

    private final AddressMapper addressMapper;
    private final BookingMapper bookingMapper;

    @Override
    public BigDecimal previewOwnerBookingPrice(OwnerBookingRequest request) {
        if (request.getSlots() == null || request.getSlots().isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal total = BigDecimal.ZERO;

        for (SlotRequest slotReq : request.getSlots()) {
            CourtCopy courtCopy = courtCopyRepository.findById(slotReq.getCourtCopyId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sân"));

            BigDecimal slotPrice = calculateSlotPrice(
                    courtCopy.getCourt().getCourtId(),
                    slotReq.getStartTime(),
                    slotReq.getEndTime()
            );

            total = total.add(slotPrice);
        }

        return total;
    }

    @Override
    @Transactional
    public BookingResponse createOwnerBooking(OwnerBookingRequest request) {
        Booking booking = Booking.builder()
                .bookerName(request.getCustomerName())
                .bookerPhone(request.getPhone())
                .note(request.getNote())
                .bookingStatus(BookingStatus.BOOKED)
                .build();

        LocalDateTime earliest = null;
        LocalDateTime latest = null;

        booking = bookingRepository.save(booking);

        BigDecimal calculatedTotalPrice = BigDecimal.ZERO;

        for (SlotRequest slotReq : request.getSlots()) {
            CourtCopy courtCopy = courtCopyRepository.findById(slotReq.getCourtCopyId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sân với ID: " + slotReq.getCourtCopyId()));

            if (booking.getRentalArea() == null
                    && courtCopy.getCourt() != null
                    && courtCopy.getCourt().getRentalArea() != null) {
                booking.setRentalArea(courtCopy.getCourt().getRentalArea());
            }

            if (booking.getRenter() == null) {
                try {
                    booking.setRenter(userService.getCurrentUserEntity());
                } catch (Exception ignored) {
                }
            }

            List<Slot> conflicts = slotRepository.findConflictSlot(
                    courtCopy.getCourtCopyId(),
                    slotReq.getStartTime(),
                    slotReq.getEndTime()
            );

            if (!conflicts.isEmpty()) {
                throw new RuntimeException(
                        "Sân " + courtCopy.getCourtCode()
                                + " đã bị đặt trong khung giờ "
                                + slotReq.getStartTime().toLocalTime()
                                + " - "
                                + slotReq.getEndTime().toLocalTime()
                );
            }

            BigDecimal slotPrice = calculateSlotPrice(
                    courtCopy.getCourt().getCourtId(),
                    slotReq.getStartTime(),
                    slotReq.getEndTime()
            );

            calculatedTotalPrice = calculatedTotalPrice.add(slotPrice);

            Slot slot = Slot.builder()
                    .startTime(slotReq.getStartTime())
                    .endTime(slotReq.getEndTime())
                    .price(slotPrice)
                    .slotStatus(SlotStatus.BOOKED)
                    .courtCopy(courtCopy)
                    .booking(booking)
                    .build();

            slotRepository.save(slot);

            if (earliest == null || slotReq.getStartTime().isBefore(earliest)) {
                earliest = slotReq.getStartTime();
            }

            if (latest == null || slotReq.getEndTime().isAfter(latest)) {
                latest = slotReq.getEndTime();
            }
        }

        if (earliest != null) {
            booking.setStartTime(earliest);
        }

        if (latest != null) {
            booking.setEndTime(latest);
        }

        BigDecimal deposit = request.getPaidAmount() != null
                ? request.getPaidAmount()
                : BigDecimal.ZERO;

        if (deposit.compareTo(calculatedTotalPrice) > 0) {
            throw new RuntimeException("Số tiền khách trả không được lớn hơn tổng tiền");
        }

        BigDecimal remaining = calculatedTotalPrice.subtract(deposit);

        booking.setTotalPrice(calculatedTotalPrice);
        booking.setDepositAmount(deposit);
        booking.setRemainingAmount(remaining);

        if (remaining.compareTo(BigDecimal.ZERO) == 0) {
            booking.setBookingStatus(BookingStatus.COMPLETED);
        } else {
            booking.setBookingStatus(BookingStatus.BOOKED);
        }

        bookingRepository.save(booking);

        if (deposit.compareTo(BigDecimal.ZERO) > 0) {
            Payment payment = Payment.builder()
                    .amount(deposit)
                    .transactionDate(LocalDateTime.now())
                    .paymentStatus(PaymentStatus.SUCCESS)
                    .paymentType(
                            deposit.compareTo(calculatedTotalPrice) >= 0
                                    ? PaymentType.FULL
                                    : PaymentType.DEPOSIT
                    )
                    .paymentMethod(request.getPaymentMethod())
                    .booking(booking)
                    .build();

            paymentRepository.save(payment);

            Transaction transaction = Transaction.builder()
                    .type(TransactionType.INCOME)
                    .amount(deposit)
                    .booking(booking)
                    .referenceId(String.valueOf(booking.getBookingId()))
                    .rentalArea(booking.getRentalArea())
                    .owner(booking.getRentalArea().getOwner())
                    .paymentMethod(request.getPaymentMethod())
                    .status(TransactionStatus.SUCCESS)
                    .category(
                            remaining.compareTo(BigDecimal.ZERO) == 0
                                    ? TransactionCategory.BOOKING_FULL_PAYMENT
                                    : TransactionCategory.BOOKING_DEPOSIT
                    )
                    .description(
                            remaining.compareTo(BigDecimal.ZERO) == 0
                                    ? "Thu đủ tiền khi tạo booking tại sân"
                                    : "Thu tiền cọc khi tạo booking tại sân"
                    )
                    .build();

            transactionRepository.save(transaction);
        }

        return bookingMapper.toBookingResponse(booking);
    }

    public BigDecimal calculateSlotPrice(UUID courtId, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDate bookingDate = startTime.toLocalDate();
        LocalTime start = startTime.toLocalTime();
        LocalTime end = endTime.toLocalTime();

        List<CourtPrice> prices = courtPriceRepository.findValidPricesForCourtAndDate(courtId, bookingDate);

        BigDecimal totalPrice = BigDecimal.ZERO;
        LocalTime currentTime = start;

        while (currentTime.isBefore(end)) {
            LocalTime finalCurrentTime = currentTime;
            CourtPrice currentPriceBracket = prices.stream()
                    .filter(p -> !finalCurrentTime.isBefore(p.getStartTime()) && finalCurrentTime.isBefore(p.getEndTime()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy cấu hình giá cho khung giờ: " + finalCurrentTime));

            LocalTime overlapEnd = end.isBefore(currentPriceBracket.getEndTime()) ? end : currentPriceBracket.getEndTime();

            long minutes = Duration.between(currentTime, overlapEnd).toMinutes();
            BigDecimal hoursDuration = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);

            BigDecimal segmentPrice = hoursDuration.multiply(currentPriceBracket.getPricePerHour());
            totalPrice = totalPrice.add(segmentPrice);

            currentTime = overlapEnd;
        }

        return totalPrice;
    }

    @Override
    @Transactional
    public void addExtraServices(UUID bookingId, AddExtraServicesRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Booking với ID: " + bookingId));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn dịch vụ");
        }

        BigDecimal totalExtraCost = BigDecimal.ZERO;

        for (AddExtraServicesRequest.ServiceItemRequest itemReq : request.getItems()) {
            if (itemReq.getServiceId() == null) {
                throw new RuntimeException("Thiếu serviceId");
            }

            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new RuntimeException("Số lượng dịch vụ không hợp lệ");
            }

            ServiceItem serviceItem = serviceItemRepository.findById(itemReq.getServiceId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy dịch vụ: " + itemReq.getServiceId()));

            if (serviceItem.getQuantity() < itemReq.getQuantity()) {
                throw new RuntimeException(
                        "Số lượng dịch vụ " + serviceItem.getServiceName()
                                + " không đủ. Hiện còn: " + serviceItem.getQuantity()
                );
            }

            serviceItem.setQuantity(serviceItem.getQuantity() - itemReq.getQuantity());
            serviceItemRepository.save(serviceItem);

            BookingServiceItem bsi = BookingServiceItem.builder()
                    .booking(booking)
                    .serviceItem(serviceItem)
                    .quantity(itemReq.getQuantity())
                    .price(serviceItem.getPriceSell())
                    .build();

            bookingServiceItemRepository.save(bsi);

            BigDecimal itemTotal = serviceItem.getPriceSell()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            totalExtraCost = totalExtraCost.add(itemTotal);
        }

        booking.setTotalPrice(
                Optional.ofNullable(booking.getTotalPrice()).orElse(BigDecimal.ZERO)
                        .add(totalExtraCost)
        );

        booking.setRemainingAmount(
                Optional.ofNullable(booking.getRemainingAmount()).orElse(BigDecimal.ZERO)
                        .add(totalExtraCost)
        );

        bookingRepository.save(booking);
    }

    @Transactional
    public void collectRemainingPayment(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Booking"));

        BigDecimal amountToCollect = booking.getRemainingAmount();
        if (amountToCollect == null || amountToCollect.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Đơn hàng này không còn nợ");
        }

        Transaction transaction = Transaction.builder()
                .booking(booking)
                .referenceId(String.valueOf(booking.getBookingId()))
                .rentalArea(booking.getRentalArea())
                .owner(booking.getRentalArea().getOwner())
                .type(TransactionType.INCOME)
                .amount(amountToCollect)
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .category(TransactionCategory.BOOKING_REMAINING_PAYMENT)
                .description("Thu tiền mặt hoặc chuyển khoản tại sân phần còn thiếu (bao gồm sân và dịch vụ) cho đạt lịch " + booking.getBookingId())
                .build();
        transactionRepository.save(transaction);

        booking.setRemainingAmount(BigDecimal.ZERO);
        booking.setBookingStatus(BookingStatus.COMPLETED);

        bookingRepository.save(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public CheckAvailabilityResponse checkAvailability(SlotRequest request) {

        Court court = courtRepository.findById(request.getCourtId())
                .orElseThrow(() -> new AppException(ErrorCode.COURT_NOT_FOUND));
        System.err.println(court.getCourtId());
        RentalArea rentalArea = court.getRentalArea();

        if (!Boolean.TRUE.equals(rentalArea.getIsActive()) || rentalArea.getStatus() != RentalAreaStatus.ACTIVE) {
            return new CheckAvailabilityResponse(false, "Khu vực sân hiện không hoạt động");
        }
        if (court.getCourtStatus() != CourtStatus.ACTIVE) {
            return new CheckAvailabilityResponse(false, "Loại sân này đang tạm bảo trì");
        }
        LocalTime reqStartTime = request.getStartTime().toLocalTime();
        LocalTime reqEndTime = request.getEndTime().toLocalTime();

        if (reqStartTime.isBefore(rentalArea.getOpenTime()) || reqEndTime.isAfter(rentalArea.getCloseTime())) {
            return new CheckAvailabilityResponse(
                    false,
                    String.format("Giờ hoạt động của cơ sở là từ %s đến %s. Vui lòng chọn lại.",
                            rentalArea.getOpenTime().toString(),
                            rentalArea.getCloseTime().toString())
            );
        }

        int requestQuantity = request.getQuantity() == null ? 1 : request.getQuantity();

        List<CourtCopy> activeCopies = courtCopyRepository
                .findByCourt_CourtIdAndCourtCopyStatus(court.getCourtId(), CourtCopyStatus.ACTIVE);

        if (activeCopies.isEmpty()) {
            return new CheckAvailabilityResponse(false, "Không có sân nào khả dụng lúc này");
        }

        int availableCount = 0;
        for (CourtCopy copy : activeCopies) {
            List<Slot> conflicts = slotRepository.findConflictSlot(
                    copy.getCourtCopyId(),
                    request.getStartTime(),
                    request.getEndTime()
            );
            if (conflicts.isEmpty()) {
                availableCount++;
            }
        }

        if (availableCount < requestQuantity) {
            if (availableCount == 0) {
                return new CheckAvailabilityResponse(false, "Rất tiếc, khung giờ này đã kín sân.");
            } else {
                return new CheckAvailabilityResponse(false, "Chỉ còn trống " + availableCount + " sân trong khung giờ này.");
            }
        }

        return new CheckAvailabilityResponse(true, "Sân khả dụng", availableCount);
    }

    @Override
    @Transactional
    public BookingIntentResponse createBookingIntent(BookingRequest request) {

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            String currentPhone = user.getPhone();
            if (currentPhone == null || currentPhone.trim().isEmpty()) {
                user.setPhone(request.getUserPhone());
                userRepository.save(user);
            }
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

                if (copy.getCourtCopyStatus() != CourtCopyStatus.ACTIVE) {
                    throw new RuntimeException("Sân con này hiện đang ngừng kinh doanh");
                }

                if (copy.getCourt().getCourtStatus() != CourtStatus.ACTIVE) {
                    throw new RuntimeException("Sân này hiện đang ngừng kinh doanh");
                }
                if (copy.getCourt().getRentalArea().getStatus() != RentalAreaStatus.ACTIVE) {
                    throw new RuntimeException("Tòa nhà này hiện đang ngừng kinh doanh");
                }

                List<Slot> conflicts = slotRepository.findConflictSlot(
                        copy.getCourtCopyId(),
                        slotReq.getStartTime(),
                        slotReq.getEndTime()
                );

                if (!conflicts.isEmpty()) {
                    throw new RuntimeException("Sân đã có lịch trong khung giờ này");
                }

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

        List<CourtPrice> rules = courtPriceRepository.findByCourtIdOrderByPriorityDesc(court.getCourtId());

        if (rules.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal total = BigDecimal.ZERO;
        LocalDateTime cursor = start;

        while (cursor.isBefore(end)) {
            LocalDateTime nextMinute = cursor.plusMinutes(1);

            BigDecimal pricePerHour = pickBestRulePerHour(rules, cursor);

            BigDecimal pricePerMinute = pricePerHour.divide(BigDecimal.valueOf(60), 10, RoundingMode.HALF_UP);
            total = total.add(pricePerMinute);

            cursor = nextMinute;
        }

        return total.setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal pickBestRulePerHour(List<CourtPrice> rules, LocalDateTime moment) {
        LocalTime time = moment.toLocalTime();
        LocalDate date = moment.toLocalDate();
        DayOfWeek dow = date.getDayOfWeek();
        boolean isWeekend = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);

        for (CourtPrice cp : rules) {
            if (!isTimeInRange(time, cp.getStartTime(), cp.getEndTime())) {
                continue;
            }

            if (cp.getStartDate() != null && date.isBefore(cp.getStartDate())) continue;
            if (cp.getEndDate() != null && date.isAfter(cp.getEndDate())) continue;

            if (cp.getSpecificDate() != null && !cp.getSpecificDate().equals(date)) {
                continue;
            }

            if (cp.getDayType() != null && cp.getDayType() != DayType.ALL) {
                if (cp.getDayType() == DayType.WEEKDAY && isWeekend) continue;
                if (cp.getDayType() == DayType.WEEKEND && !isWeekend) continue;
            }

            return cp.getPricePerHour();
        }

        return BigDecimal.ZERO;
    }

    private boolean isTimeInRange(LocalTime time, LocalTime start, LocalTime end) {
        if (start == null || end == null) return true;

        if (start.isBefore(end)) {
            return !time.isBefore(start) && time.isBefore(end);
        } else {
            return !time.isBefore(start) || time.isBefore(end);
        }
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
    public BookingResponse confirmBooking(UUID bookingIntentId, Payment payment) {

        BookingIntent intent = bookingIntentRepository
                .findById(bookingIntentId)
                .orElseThrow();

        if (intent.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Hold expired");
        }
        BigDecimal totalPrice = intent.getPreviewPrice();
        BigDecimal paidAmount = payment.getAmount();
        BigDecimal remainingAmount = totalPrice.subtract(paidAmount);
        Booking booking = Booking.builder()
                .bookingStatus(BookingStatus.BOOKED)
                .renter(intent.getUser() != null ? intent.getUser() : null)
                .bookerName(intent.getBookerName())
                .bookerPhone(intent.getBookerPhone())
                .depositAmount(paidAmount)
                .remainingAmount(remainingAmount)
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

        payment.setBooking(booking);
        payment.setTransactionDate(LocalDateTime.now());
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setPaymentType(
                paidAmount.compareTo(totalPrice) >= 0
                        ? PaymentType.FULL
                        : PaymentType.DEPOSIT
        );
        paymentRepository.save(payment);

        Transaction transaction = Transaction.builder()
                .type(TransactionType.INCOME)
                .amount(paidAmount)
                .booking(booking)
                .referenceId(String.valueOf(booking.getBookingId()))
                .rentalArea(booking.getRentalArea())
                .owner(booking.getRentalArea().getOwner())
                .paymentMethod(payment.getPaymentMethod())
                .status(TransactionStatus.SUCCESS)
                .category(
                        remainingAmount.compareTo(BigDecimal.ZERO) <= 0
                                ? TransactionCategory.BOOKING_FULL_PAYMENT
                                : TransactionCategory.BOOKING_DEPOSIT
                )
                .description(
                        remainingAmount.compareTo(BigDecimal.ZERO) <= 0
                                ? "User thanh toán đủ tiền khi đặt sân"
                                : "User thanh toán tiền cọc khi đặt sân"
                )
                .build();

        transactionRepository.save(transaction);
        bookingIntentRepository.save(intent);
        return BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .totalPrice(booking.getTotalPrice())
                .bookingStatus(booking.getBookingStatus())
                .depositAmount(booking.getDepositAmount())
                .remainingAmount(booking.getRemainingAmount())
                .slots(slotResponses)
                .createdAt(booking.getCreatedAt())
                .bookingType(booking.getBookingType())
                .build();
    }

    @Override
    public BookingResponse getBookingById(UUID bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        Optional<Payment> payment = paymentRepository
                .findFirstByBookingOrderByTransactionDateDesc(booking);

        String paymentMethod = null;
        if (payment.isPresent()) {
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
        List<BookingResponse.BookingServiceResponse> extraServiceResponses = bookingServiceItemRepository.findByBooking(booking)
                .stream()
                .map(bsi -> BookingResponse.BookingServiceResponse.builder()
                        .serviceId(bsi.getServiceItem().getServiceItemId())
                        .serviceName(bsi.getServiceItem().getServiceName())
                        .quantity(bsi.getQuantity())
                        .price(bsi.getPrice())
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
                                .address(addressMapper.toAddressResponse(booking.getRentalArea().getAddress()))
                                .contactPhone(booking.getRentalArea().getContactPhone())
                                .build()
                )
                .depositAmount(booking.getDepositAmount())
                .remainingAmount(booking.getRemainingAmount())
                .paymentMethod(paymentMethod)
                .extraServiceResponses(extraServiceResponses)
                .bookingType(booking.getBookingType())
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
                .map(bookingMapper::toBookingResponse)
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
            BookingStatus bookingStatus,
            String keyword,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {

        UUID userId = userService.getCurrentUserEntity().getUserId();

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
                .map(bookingMapper::toBookingResponse)
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
                .map(bookingMapper::toBookingResponse)
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

        return bookingMapper.toBookingResponse(booking);
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

        return availableCopies.getFirst();
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

        if (status == BookingStatus.BOOKED) {
            slotStatus = SlotStatus.BOOKED;
        } else if (status == BookingStatus.USING) {
            slotStatus = SlotStatus.BOOKED;
        } else if (status == BookingStatus.COMPLETED) {
            slotStatus = SlotStatus.COMPLETED;
        } else if (status == BookingStatus.CANCELLED) {
            slotStatus = SlotStatus.AVAILABLE;
        }

        if (slotStatus != null) {
            for (Slot s : booking.getSlots()) {

                s.setSlotStatus(slotStatus);

                if (status == BookingStatus.CANCELLED) {
                    s.setBooking(null);
                }
            }
        }
    }

    private void recalculateBookingSummary(Booking booking) {

        BigDecimal totalSlotPrice = booking.getSlots().stream()
                .map(Slot::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalServicePrice = bookingServiceItemRepository.findByBooking(booking).stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal total = totalSlotPrice.add(totalServicePrice);

        LocalDateTime minStart = booking.getSlots().stream()
                .map(Slot::getStartTime)
                .min(LocalDateTime::compareTo)
                .orElse(null);

        LocalDateTime maxEnd = booking.getSlots().stream()
                .map(Slot::getEndTime)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        booking.setTotalPrice(total);
        booking.setStartTime(minStart);
        booking.setEndTime(maxEnd);

        BigDecimal deposit = booking.getDepositAmount() == null
                ? BigDecimal.ZERO
                : booking.getDepositAmount();

        BigDecimal remaining = total.subtract(deposit);

        booking.setRemainingAmount(
                remaining.compareTo(BigDecimal.ZERO) < 0
                        ? BigDecimal.ZERO
                        : remaining
        );

        BigDecimal overpaid = deposit.subtract(total);

        if (overpaid.compareTo(BigDecimal.ZERO) > 0) {
            Transaction refundTransaction = Transaction.builder()
                    .type(TransactionType.EXPENSE)
                    .amount(overpaid)
                    .booking(booking)
                    .referenceId(String.valueOf(booking.getBookingId()))
                    .paymentMethod(PaymentMethod.CASH)
                    .description("Hoàn tiền do cập nhật booking giảm giá")
                    .build();

            transactionRepository.save(refundTransaction);
        }
    }

    @Override
    @Transactional
    public BookingResponse cancelBookingByUser(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking"));

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking này đã được hủy trước đó");
        }

        if (booking.getBookingStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Booking đã hoàn thành, không thể hủy");
        }

        BigDecimal depositAmount = booking.getDepositAmount() != null
                ? booking.getDepositAmount()
                : BigDecimal.ZERO;

        booking.setBookingStatus(BookingStatus.CANCELLED);
        booking.setRemainingAmount(BigDecimal.ZERO);

        String noteAppend;

        if (depositAmount.compareTo(BigDecimal.ZERO) > 0) {
            boolean isLateCancel = false;

            if (booking.getStartTime() != null) {
                LocalDateTime cancelThreshold = booking.getStartTime().minusHours(5);
                if (!LocalDateTime.now().isBefore(cancelThreshold)) {
                    isLateCancel = true;
                }
            }

            if (isLateCancel) {
                noteAppend = "Người dùng tự hủy booking. Mất cọc " + depositAmount + "đ và bị trừ điểm uy tín.";

                if (booking.getRenter() != null) {
                    User renter = booking.getRenter();
                    int currentScore = renter.getCreditScore() != null ? renter.getCreditScore() : 100;
                    renter.setCreditScore(Math.max(0, currentScore - 10));
                    userRepository.save(renter);

                    reputationLogRepository.save(
                            ReputationLog.builder()
                                    .user(renter)
                                    .pointsChanged(-10)
                                    .reason("Hủy booking dưới 24h")
                                    .build());
                }
            } else {
                noteAppend = "Người dùng tự hủy booking sớm (trước 24h). Mất cọc " + depositAmount + "đ (Không trừ uy tín).";
            }
        } else {
            noteAppend = "Người dùng tự hủy booking (Chưa phát sinh tiền cọc).";
        }

        String oldNote = booking.getNote();
        booking.setNote((oldNote == null || oldNote.isBlank() ? "" : oldNote + "\n") + noteAppend);

        if (booking.getSlots() != null && !booking.getSlots().isEmpty()) {
            booking.getSlots().forEach(slot -> {
                slot.setBooking(null);
                slot.setSlotStatus(SlotStatus.AVAILABLE);
            });

            slotRepository.saveAll(booking.getSlots());
            booking.getSlots().clear();
        }

        Booking savedBooking = bookingRepository.save(booking);

        return bookingMapper.toBookingResponse(savedBooking);
    }
}
