package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.*;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.internal.CloudinaryUploadResult;
import org.sport.backend.dto.request.booking.BookingRequest;
import org.sport.backend.dto.request.slot.SlotRequest;
import org.sport.backend.dto.response.address.AddressResponse;
import org.sport.backend.dto.response.booking.BookingIntentResponse;
import org.sport.backend.dto.response.booking.BookingResponse;
import org.sport.backend.dto.response.city.CityResponse;
import org.sport.backend.dto.response.rental.RentalAreaResponse;
import org.sport.backend.dto.response.slot.IntentSlotResponse;
import org.sport.backend.entity.*;
import org.sport.backend.repository.*;
import org.sport.backend.service.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingIntentServiceImpl implements BookingIntentService {

    private final UserRepository userRepository;
    private final SlotRepository slotRepository;
    private final CourtCopyRepository courtCopyRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BookingIntentRepository bookingIntentRepository;
    private final IntentSlotRepository intentSlotRepository;

    private final UserService userService;
    private final BookingService bookingService;
    private final CourtPriceService courtPriceService;
    private final CloudinaryService cloudinaryService;

    @Transactional
    @Override
    public BookingIntentResponse createBookingIntent(BookingRequest request) {

        User user = userService.getCurrentUserEntity();

        String currentPhone = user.getPhone();
        if (currentPhone == null || currentPhone.trim().isEmpty()) {
            user.setPhone(request.getUserPhone());
            userRepository.save(user);
        }

        BookingIntent intent = BookingIntent.builder()
                .user(user)
                .bookerName(request.getUserName())
                .bookerPhone(request.getUserPhone())
                .status(BookingIntentStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .note(request.getNote())
                .createdAt(LocalDateTime.now())
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

                boolean hasHeldIntent = hasBlockingIntent(
                        copy.getCourtCopyId(),
                        slotReq.getStartTime(),
                        slotReq.getEndTime()
                );

                if (!conflicts.isEmpty() || hasHeldIntent) {
                    throw new RuntimeException(
                            "Sân đã được đặt hoặc đang được giữ chỗ!" +
                                    " Vui lòng thử lại khung giờ này sau 5 phút."
                    );
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

                            boolean hasHeldIntent = hasBlockingIntent(
                                    copy.getCourtCopyId(),
                                    slotReq.getStartTime(),
                                    slotReq.getEndTime()
                            );

                            return conflicts.isEmpty() && !hasHeldIntent;

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


                BigDecimal price = courtPriceService.calculatePrice(
                        courtCopy,
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
        BankAccount bankAccount = bankAccountRepository
                .findByUser_UserId(intent.getRentalArea().getOwner().getUserId())
                .orElseThrow(() -> new RuntimeException("Owner chưa cấu hình tài khoản ngân hàng"));

        String transferContent = "LACEUP " + intent.getBookingIntentId().toString().substring(0, 8);

        String vietQrUrl = buildVietQrUrl(
                bankAccount.getBankBin(),
                bankAccount.getAccountNumber(),
                intent.getPreviewPrice(),
                transferContent,
                bankAccount.getAccountHolderName()
        );
        System.err.println(vietQrUrl);
        return BookingIntentResponse.builder()
                .bookingIntentId(intent.getBookingIntentId())
                .previewPrice(totalPrice)
                .expiresAt(intent.getExpiresAt())
                .status(intent.getStatus())
                .slots(slotResponses)
                .bankName(rentalArea != null && rentalArea.getOwner() != null ? rentalArea.getOwner().getBankAccount() != null ? rentalArea.getOwner().getBankAccount().getBankName() : null : null)
                .accountNumber(rentalArea != null && rentalArea.getOwner() != null ? rentalArea.getOwner().getBankAccount() != null ? rentalArea.getOwner().getBankAccount().getAccountNumber() : null : null)
                .accountName(rentalArea != null && rentalArea.getOwner() != null ? rentalArea.getOwner().getBankAccount() != null ? rentalArea.getOwner().getBankAccount().getAccountHolderName() : null : null)
                .vietQrUrl(vietQrUrl)
                .build();
    }

    @Override
    public List<BookingIntentResponse> getMyBookingIntents() {
        var currentUser = userService.getCurrentUserEntity();

        return bookingIntentRepository
                .findByBookerPhone(currentUser.getPhone())
                .stream()
                .filter(intent -> intent.getStatus() != BookingIntentStatus.CONFIRMED)
                .map(intent -> {

                    List<IntentSlotResponse> slotResponses =
                            intent.getSlots() == null
                                    ? List.of()
                                    : intent.getSlots()
                                    .stream()
                                    .map(slot -> IntentSlotResponse.builder()
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
                                            .startTime(slot.getStartTime())
                                            .endTime(slot.getEndTime())
                                            .price(slot.getPrice())
                                            .build())
                                    .toList();

                    // Xử lý lấy thông tin ngân hàng và tạo mã VietQR an toàn
                    String bankName = null;
                    String accountNumber = null;
                    String accountName = null;
                    String vietQrUrl = null;

                    if (intent.getRentalArea() != null && intent.getRentalArea().getOwner() != null) {
                        BankAccount bankAccount = intent.getRentalArea().getOwner().getBankAccount();
                        if (bankAccount != null) {
                            bankName = bankAccount.getBankName();
                            accountNumber = bankAccount.getAccountNumber();
                            accountName = bankAccount.getAccountHolderName();

                            // Tạo nội dung chuyển khoản và URL VietQR
                            String transferContent = "LACEUP " + intent.getBookingIntentId().toString().substring(0, 8);
                            vietQrUrl = buildVietQrUrl(
                                    bankAccount.getBankBin(),
                                    bankAccount.getAccountNumber(),
                                    intent.getPreviewPrice(),
                                    transferContent,
                                    bankAccount.getAccountHolderName()
                            );
                        }
                    }

                    return BookingIntentResponse.builder()
                            .bookingIntentId(intent.getBookingIntentId())
                            .bookerName(intent.getBookerName())
                            .bookerPhone(intent.getBookerPhone())
                            .title(intent.getTitle())
                            .note(intent.getNote())
                            .previewPrice(intent.getPreviewPrice())
                            .startTime(intent.getStartTime())
                            .endTime(intent.getEndTime())
                            .expiresAt(intent.getExpiresAt())
                            .status(intent.getStatus())
                            .paymentProofUrl(intent.getPaymentProofUrl())
                            .paymentProofUploadedAt(intent.getPaymentProofUploadedAt())
                            .createdAt(intent.getCreatedAt())
                            .rentalArea(intent.getRentalArea() != null
                                    ? RentalAreaResponse.builder()
                                    .rentalAreaId(intent.getRentalArea().getRentalAreaId())
                                    .rentalAreaName(intent.getRentalArea().getRentalAreaName())
                                    .address(
                                            intent.getRentalArea().getAddress() != null
                                                    ? AddressResponse.builder().street(intent.getRentalArea().getAddress().getStreet()).ward(intent.getRentalArea().getAddress().getWard()).city(CityResponse.builder().cityName(intent.getRentalArea().getAddress().getCity().getCityName()).build()).build()
                                                    : null
                                    )
                                    .contactName(intent.getRentalArea().getContactName())
                                    .contactPhone(intent.getRentalArea().getContactPhone())
                                    .build()
                                    : null
                            )
                            .slots(slotResponses)
                            // Map các dữ liệu ngân hàng đã xử lý vào Response
                            .bankName(bankName)
                            .accountNumber(accountNumber)
                            .accountName(accountName)
                            .vietQrUrl(vietQrUrl)
                            .build();

                })
                .toList();
    }

    @Override
    public PageResponse<BookingIntentResponse> getMyRentalBookingIntents(
            UUID rentalId,
            BookingIntentStatus status,
            int page,
            int size
    ) {

        Pageable pageable = PageRequest.of(
                page - 1,
                size,
                Sort.by(Sort.Order.desc("createdAt"))
        );

        Page<BookingIntent> intentPage =
                bookingIntentRepository.findByRentalArea_RentalAreaIdAndStatus(
                        rentalId,
                        status,
                        pageable
                );

        List<BookingIntentResponse> responses = intentPage.getContent()
                .stream()
                .map(intent -> {

                    List<IntentSlotResponse> slotResponses =
                            intent.getSlots() == null
                                    ? List.of()
                                    : intent.getSlots()
                                    .stream()
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
                            .bookerName(intent.getBookerName())
                            .bookerPhone(intent.getBookerPhone())
                            .previewPrice(intent.getPreviewPrice())
                            .startTime(intent.getStartTime())
                            .endTime(intent.getEndTime())
                            .expiresAt(intent.getExpiresAt())
                            .status(intent.getStatus())
                            .note(intent.getNote())

                            .paymentProofUrl(intent.getPaymentProofUrl())
                            .paymentProofUploadedAt(
                                    intent.getPaymentProofUploadedAt()
                            )

                            .slots(slotResponses)
                            .build();
                })
                .toList();

        return PageResponse.<BookingIntentResponse>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(intentPage.getTotalPages())
                .totalElements(intentPage.getTotalElements())
                .data(responses)
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
                .bankName(bookingIntent.getRentalArea() != null && bookingIntent.getRentalArea().getOwner() != null ? bookingIntent.getRentalArea().getOwner().getBankAccount() != null ? bookingIntent.getRentalArea().getOwner().getBankAccount().getBankName() : null : null)
                .accountNumber(bookingIntent.getRentalArea() != null && bookingIntent.getRentalArea().getOwner() != null ? bookingIntent.getRentalArea().getOwner().getBankAccount() != null ? bookingIntent.getRentalArea().getOwner().getBankAccount().getAccountNumber() : null : null)
                .accountName(bookingIntent.getRentalArea() != null && bookingIntent.getRentalArea().getOwner() != null ? bookingIntent.getRentalArea().getOwner().getBankAccount() != null ? bookingIntent.getRentalArea().getOwner().getBankAccount().getAccountHolderName() : null : null)
                .build();
    }

    @Transactional
    @Override
    public BookingResponse ownerConfirmManualBooking(UUID intentId) {
        BookingIntent intent = bookingIntentRepository.findById(intentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu đặt sân"));

        if (intent.getStatus() != BookingIntentStatus.PENDING_OWNER_CONFIRM) {
            throw new RuntimeException("Yêu cầu này chưa ở trạng thái chờ owner xác nhận");
        }

        if (intent.getPaymentProofUrl() == null || intent.getPaymentProofUrl().isBlank()) {
            throw new RuntimeException("Chưa có ảnh chuyển khoản");
        }

        Payment payment = Payment.builder()
                .amount(intent.getPreviewPrice())
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .paymentStatus(PaymentStatus.SUCCESS)
                .transactionDate(LocalDateTime.now())
                .build();

        return bookingService.confirmBooking(intentId, payment);
    }

    @Transactional
    @Override
    public void ownerRejectManualBooking(UUID intentId) {
        BookingIntent intent = bookingIntentRepository.findById(intentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu đặt sân"));

        if (intent.getStatus() != BookingIntentStatus.PENDING_OWNER_CONFIRM) {
            throw new RuntimeException("Yêu cầu này chưa ở trạng thái chờ owner xác nhận");
        }

        intent.setStatus(BookingIntentStatus.REJECTED);
        bookingIntentRepository.save(intent);
    }

    @Transactional
    @Override
    public String uploadIntentPaymentProof(UUID intentId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ảnh chuyển khoản");
        }

        BookingIntent intent = bookingIntentRepository.findById(intentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu đặt sân"));

        LocalDateTime now = LocalDateTime.now();

        if (intent.getStatus() == BookingIntentStatus.ACTIVE
                && intent.getExpiresAt() != null
                && !now.isBefore(intent.getExpiresAt())) {

            intent.setStatus(BookingIntentStatus.EXPIRED);
            bookingIntentRepository.save(intent);

            throw new RuntimeException(
                    "Đã hết 5 phút giữ chỗ. Vui lòng chọn lại thời gian"
            );
        }

        if (intent.getStatus() != BookingIntentStatus.ACTIVE
                && intent.getStatus() != BookingIntentStatus.PENDING_OWNER_CONFIRM) {
            throw new RuntimeException("Yêu cầu đặt sân không còn hiệu lực");
        }

        CloudinaryUploadResult uploadResult = cloudinaryService.uploadImage(
                image,
                "payment-proofs/"
                        + intent.getRentalArea().getRentalAreaId()
                        + "/"
                        + intent.getBookingIntentId()
        );

        intent.setPaymentProofUrl(uploadResult.getUrl());
        intent.setPaymentProofPublicId(uploadResult.getPublicId());
        intent.setPaymentProofUploadedAt(LocalDateTime.now());
        intent.setStatus(BookingIntentStatus.PENDING_OWNER_CONFIRM);
        intent.setExpiresAt(null);
        bookingIntentRepository.save(intent);

        return uploadResult.getUrl();
    }

    private String buildVietQrUrl(
            String bankBin,
            String accountNumber,
            BigDecimal amount,
            String addInfo,
            String accountName
    ) {
        String encodedAddInfo = URLEncoder.encode(addInfo, StandardCharsets.UTF_8);
        String encodedAccountName = URLEncoder.encode(accountName, StandardCharsets.UTF_8);

        return "https://img.vietqr.io/image/"
                + bankBin
                + "-"
                + accountNumber
                + "-compact2.png"
                + "?amount=" + amount.setScale(0, RoundingMode.HALF_UP)
                + "&addInfo=" + encodedAddInfo
                + "&accountName=" + encodedAccountName;
    }

    private boolean hasBlockingIntent(
            UUID courtCopyId,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {
        return intentSlotRepository.countBlockingIntentSlots(
                courtCopyId,
                startTime,
                endTime,
                LocalDateTime.now(),
                BookingIntentStatus.ACTIVE,
                BookingIntentStatus.PENDING_OWNER_CONFIRM
        ) > 0;
    }

}
