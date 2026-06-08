package org.sport.backend.serviceImpl;



import lombok.RequiredArgsConstructor;
import org.sport.backend.constant.*;
import org.sport.backend.dto.request.user.DeleteAccountRequest;
import org.sport.backend.dto.response.user.DeleteAccountResponse;
import org.sport.backend.entity.*;
import org.sport.backend.repository.*;
import org.sport.backend.repository.mongo.RefreshTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AccountDeletionServiceImpl {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final BookingIntentRepository bookingIntentRepository;
    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final MatchRepository matchRepository;
    private final MatchRegistrationRepository matchRegistrationRepository;
    private final RentalAreaRepository rentalAreaRepository;
    private final SettlementRepository settlementRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final NotificationRepository notificationRepository;
    private final BankAccountRepository bankAccountRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserCategoryRankRepository userCategoryRankRepository;
    private final ReputationLogRepository reputationLogRepository;
    private final MatchResultRepository matchResultRepository;

    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Set<BookingStatus> BLOCKING_BOOKINGS =
            Collections.unmodifiableSet(EnumSet.of(
                    BookingStatus.PENDING,
                    BookingStatus.AWAITING_PAYMENT,
                    BookingStatus.BOOKED,
                    BookingStatus.USING
            ));

    private static final Set<BookingIntentStatus> BLOCKING_INTENTS =
            Collections.unmodifiableSet(EnumSet.of(
                    BookingIntentStatus.ACTIVE,
                    BookingIntentStatus.PENDING_OWNER_CONFIRM
            ));

    private static final Set<PaymentStatus> BLOCKING_PAYMENTS =
            Collections.unmodifiableSet(EnumSet.of(
                    PaymentStatus.PENDING,
                    PaymentStatus.REFUND_PENDING
            ));

    private static final Set<MatchStatus> BLOCKING_MATCHES =
            Collections.unmodifiableSet(EnumSet.of(
                    MatchStatus.OPEN,
                    MatchStatus.READY,
                    MatchStatus.PLAYING,
                    MatchStatus.WAITING_RESULT_APPROVAL,
                    MatchStatus.DISPUTED
            ));

    @Transactional
    public DeleteAccountResponse requestDeletion(
            UUID userId,
            DeleteAccountRequest request
    ) {
        Objects.requireNonNull(
                userId,
                "userId không được null"
        );

        Objects.requireNonNull(
                request,
                "DeleteAccountRequest không được null"
        );

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy tài khoản"
                        )
                );

        if (isAdmin(user)) {
            throw new IllegalStateException(
                    "Tài khoản quản trị nội bộ "
                            + "không thể tự xóa trong ứng dụng"
            );
        }

        String confirmation = Optional
                .ofNullable(request.getConfirmation())
                .orElse("")
                .trim();

        if (!"XOA".equalsIgnoreCase(confirmation)) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập XOA để xác nhận"
            );
        }

        verifyPassword(
                user,
                request.getPassword()
        );

        if (user.getAccountDeletionStatus()
                == AccountDeletionStatus.COMPLETED) {
            throw new IllegalStateException(
                    "Tài khoản đã được xóa trước đó"
            );
        }

        if (user.getAccountDeletionStatus()
                == AccountDeletionStatus.PROCESSING) {
            throw new IllegalStateException(
                    "Tài khoản đang được hệ thống xử lý xóa"
            );
        }


        expireBookingIntentsOfUser(userId);

        LocalDateTime now = LocalDateTime.now();

        user.setAccountDeletionStatus(
                AccountDeletionStatus.REQUESTED
        );

        user.setDeletionRequestedAt(now);

        user.setDeletionReason(
                normalizeReason(request.getReason())
        );

        List<String> blockers = findBlockers(user);

        if (!blockers.isEmpty()) {
            user.setAccountDeletionStatus(
                    AccountDeletionStatus
                            .WAITING_FOR_OBLIGATIONS
            );

            userRepository.save(user);

            return DeleteAccountResponse.builder()
                    .status(
                            AccountDeletionStatus
                                    .WAITING_FOR_OBLIGATIONS
                    )
                    .message(
                            "Yêu cầu đã được ghi nhận. "
                                    + "Tài khoản sẽ được xóa sau khi "
                                    + "các nghĩa vụ được xử lý."
                    )
                    .blockers(List.copyOf(blockers))
                    .build();
        }

        completeDeletion(user);

        return DeleteAccountResponse.builder()
                .status(AccountDeletionStatus.COMPLETED)
                .message(
                        "Tài khoản và dữ liệu cá nhân đã được xóa."
                )
                .blockers(List.of())
                .build();
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return null;
        }
        return reason.trim();
    }

    private List<String> findBlockers(User user) {
        UUID userId = user.getUserId();
        List<String> blockers = new ArrayList<>();

        if (bookingRepository
                .existsByRenter_UserIdAndBookingStatusIn(
                        userId,
                        BLOCKING_BOOKINGS
                )) {
            blockers.add("Bạn vẫn còn booking chưa hoàn thành");
        }

        /*
         * Điều kiện này chỉ đúng khi disputeFlag được đặt lại false
         * sau khi tranh chấp đã được xử lý.
         */
        if (bookingRepository
                .existsByRenter_UserIdAndDisputeFlagTrue(userId)) {
            blockers.add("Bạn vẫn còn booking đang tranh chấp");
        }

        if (bookingIntentRepository
                .existsByUser_UserIdAndStatusIn(
                        userId,
                        BLOCKING_INTENTS
                )) {
            blockers.add("Bạn vẫn còn yêu cầu đặt sân đang xử lý");
        }

        if (paymentRepository
                .existsByUser_UserIdAndPaymentStatusIn(
                        userId,
                        BLOCKING_PAYMENTS
                )) {
            blockers.add(
                    "Bạn vẫn còn thanh toán hoặc hoàn tiền đang xử lý"
            );
        }

        if (matchRepository.existsByHost_UserIdAndStatusIn(
                userId,
                BLOCKING_MATCHES
        )) {
            blockers.add(
                    "Bạn đang tổ chức trận đấu chưa hoàn thành"
            );
        }

        if (matchRegistrationRepository
                .existsByUser_UserIdAndMatch_StatusIn(
                        userId,
                        BLOCKING_MATCHES
                )) {
            blockers.add(
                    "Bạn đang tham gia trận đấu chưa hoàn thành"
            );
        }

        if (isOwner(user)) {
            addOwnerBlockers(userId, blockers);
        }

        return blockers;
    }

    private void addOwnerBlockers(
            UUID ownerId,
            List<String> blockers
    ) {
        if (rentalAreaRepository
                .existsByOwner_UserIdAndIsActiveTrue(ownerId)) {
            blockers.add(
                    "Bạn vẫn còn sân hoạt động. "
                            + "Hãy đóng sân hoặc chuyển quyền sở hữu."
            );
        }

        if (bookingRepository
                .existsByRentalArea_Owner_UserIdAndBookingStatusIn(
                        ownerId,
                        BLOCKING_BOOKINGS
                )) {
            blockers.add(
                    "Sân của bạn vẫn còn booking chưa hoàn thành"
            );
        }

        if (matchRepository
                .existsByCourt_RentalArea_Owner_UserIdAndStatusIn(
                        ownerId,
                        BLOCKING_MATCHES
                )) {
            blockers.add(
                    "Sân của bạn vẫn còn trận đấu chưa hoàn thành"
            );
        }

        if (settlementRepository
                .existsByRentalArea_Owner_UserIdAndStatus(
                        ownerId,
                        SettlementStatus.PENDING
                )) {
            blockers.add(
                    "Bạn vẫn còn khoản đối soát chưa thanh toán"
            );
        }
    }

    private boolean isOwner(User user) {
        return hasRole(user, "OWNER");
    }

    private boolean isAdmin(User user) {
        return hasRole(user, "ADMIN");
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRole() != null
                && user.getRole().getRoleName() != null
                && roleName.equalsIgnoreCase(
                user.getRole().getRoleName()
        );
    }

    private void verifyPassword(
            User user,
            String rawPassword
    ) {
        /*
         * Tài khoản GOOGLE hiện được xác thực bằng access token đang đăng nhập.
         * Trước production nên thêm re-auth Google hoặc OTP dùng một lần.
         */
        if (user.getProvider() == AuthProvider.GOOGLE
                && user.getPasswordHash() == null) {
            return;
        }

        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập mật khẩu hiện tại"
            );
        }

        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(
                rawPassword,
                user.getPasswordHash()
        )) {
            throw new IllegalArgumentException(
                    "Mật khẩu hiện tại không chính xác"
            );
        }
    }

    private void completeDeletion(User user) {
        UUID userId = user.getUserId();

        user.setAccountDeletionStatus(
                AccountDeletionStatus.PROCESSING
        );

        userRepository.saveAndFlush(user);

        deletePersonalProfileData(user);

        anonymizeBookings(userId);
        anonymizeTransactions(userId);
        anonymizePaymentsAndDeleteIntents(userId);
        anonymizeMatches(userId);
        scrubMatchResults(userId);
        anonymizeOwnedRentalAreas(userId);
        anonymizeUser(user);
    }

    private void deletePersonalProfileData(User user) {
        UUID userId = user.getUserId();
        String originalEmail = user.getEmail();

        notificationRepository
                .deleteAllByRecipient_UserId(userId);

        bankAccountRepository
                .deleteByUser_UserId(userId);

        userAchievementRepository
                .deleteAllByUser_UserId(userId);

        userCategoryRankRepository
                .deleteAllByUser_UserId(userId);

        reputationLogRepository
                .deleteAllByUser_UserId(userId);

        refreshTokenRepository
                .deleteAllByEmail(originalEmail);
    }

    private void anonymizeBookings(UUID userId) {
        List<Booking> bookings =
                bookingRepository.findAllByRenter_UserId(userId);

        for (Booking booking : bookings) {
            /*
             * Trước khi set null nên xóa file thật khỏi Cloudinary/S3
             * bằng paymentProofPublicId.
             */
            booking.setRenter(null);
            booking.setBookerName("Người dùng đã xóa");
            booking.setBookerPhone(null);
            booking.setNote(null);
            booking.setDisputeNote(null);

            booking.setPaymentProofUrl(null);
            booking.setPaymentProofPublicId(null);
            booking.setPaymentProofUploadedAt(null);


            booking.setInvoiceUrl(null);
        }

        bookingRepository.saveAllAndFlush(bookings);
    }

    private void anonymizeTransactions(UUID userId) {
        List<Transaction> transactions =
                transactionRepository.findAllByOwner_UserId(userId);

        for (Transaction transaction : transactions) {
            transaction.setOwner(null);

            if (transaction.getDescription() != null) {
                transaction.setDescription(
                        "Giao dịch đã được ẩn danh"
                );
            }
        }

        transactionRepository.saveAllAndFlush(transactions);
    }

    private void anonymizePaymentsAndDeleteIntents(UUID userId) {
        List<Payment> directPayments =
                paymentRepository.findAllByUser_UserId(userId);

        List<Payment> intentPayments =
                paymentRepository
                        .findAllByBookingIntent_User_UserId(userId);

        Map<UUID, Payment> paymentsById = new LinkedHashMap<>();

        for (Payment payment : directPayments) {
            paymentsById.put(payment.getPaymentId(), payment);
        }

        for (Payment payment : intentPayments) {
            paymentsById.put(payment.getPaymentId(), payment);
        }

        for (Payment payment : paymentsById.values()) {
            boolean belongsToDeletedUser =
                    payment.getUser() != null
                            && userId.equals(
                            payment.getUser().getUserId()
                    );

            boolean intentBelongsToDeletedUser =
                    payment.getBookingIntent() != null
                            && payment.getBookingIntent().getUser() != null
                            && userId.equals(
                            payment.getBookingIntent()
                                    .getUser()
                                    .getUserId()
                    );

            if (belongsToDeletedUser) {
                payment.setUser(null);
            }

            if (belongsToDeletedUser
                    || intentBelongsToDeletedUser) {
                /*
                 * Nếu proof là URL/file, cần xóa file thật trước.
                 */
                payment.setProof(null);
            }

            if (intentBelongsToDeletedUser) {
                payment.setBookingIntent(null);
            }
        }

        paymentRepository.saveAllAndFlush(
                paymentsById.values()
        );

        /*
         * Xóa entity theo từng bản ghi để cascade xóa IntentSlot.
         */
        List<BookingIntent> intents =
                bookingIntentRepository
                        .findAllByUser_UserId(userId);

        bookingIntentRepository.deleteAll(intents);
        bookingIntentRepository.flush();
    }

    private void anonymizeMatches(UUID userId) {
        List<Match> hostedMatches =
                matchRepository.findAllByHost_UserId(userId);

        for (Match match : hostedMatches) {
            match.setHost(null);

            /*
             * Note là nội dung do user nhập, có thể chứa thông tin cá nhân.
             */
            match.setNote(null);
        }

        matchRepository.saveAllAndFlush(hostedMatches);

        List<MatchRegistration> registrations =
                matchRegistrationRepository
                        .findAllByUser_UserId(userId);

        for (MatchRegistration registration : registrations) {
            /*
             * Không xóa registration vì Payment có thể tham chiếu.
             * Giữ teamNumber/playerCount để bảo toàn lịch sử trận.
             */
            registration.setUser(null);
        }

        matchRegistrationRepository.saveAllAndFlush(
                registrations
        );
    }

    private void scrubMatchResults(UUID userId) {

        List<MatchResult> changedResults = new ArrayList<>();

        for (MatchResult result : matchResultRepository.findAll()) {
            boolean changed = false;

            if (Objects.equals(result.getSubmitterId(), userId)) {
                result.setSubmitterId(null);
                changed = true;
            }

            if (result.getWinnerIds() != null) {
                changed |= result.getWinnerIds()
                        .removeIf(userId::equals);
            }

            if (result.getLoserIds() != null) {
                changed |= result.getLoserIds()
                        .removeIf(userId::equals);
            }

            if (result.getAbsentUserIds() != null) {
                changed |= result.getAbsentUserIds()
                        .removeIf(userId::equals);
            }

            if (result.getRankChanges() != null
                    && result.getRankChanges()
                    .remove(userId) != null) {
                changed = true;
            }

            if (changed) {
                changedResults.add(result);
            }
        }

        matchResultRepository.saveAllAndFlush(changedResults);
    }

    private void anonymizeOwnedRentalAreas(UUID ownerId) {
        List<RentalArea> areas =
                rentalAreaRepository.findAllByOwner_UserId(ownerId);

        for (RentalArea area : areas) {
            /*
             * Hàm này chỉ chạy khi không còn blocker.
             * Sân đã chuyển cho OWNER khác sẽ không nằm trong danh sách này.
             */
            area.setOwner(null);
            area.setIsActive(false);
            area.setStatus(RentalAreaStatus.INACTIVE);
            area.setVerificationStatus(VerificationStatus.HIDDEN);
            area.setDeletedAt(LocalDateTime.now());

            area.setContactName(null);
            area.setContactPhone(null);
            area.setGmail(null);
            area.setFacebookLink(null);
            area.setReason(null);
        }

        rentalAreaRepository.saveAllAndFlush(areas);
    }

    private void anonymizeUser(User user) {
        Role deletedRole = roleRepository
                .findByRoleNameIgnoreCase("DELETED")
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Chưa cấu hình role DELETED"
                        ));

        user.setUserName("Người dùng đã xóa");
        user.setEmail(
                "deleted-"
                        + UUID.randomUUID()
                        + "@deleted.invalid"
        );

        user.setPasswordHash(null);
        user.setGoogleId(null);
        user.setProvider(null);

        user.setPhone(null);
        user.setGender(null);
        user.setDateOfBirth(null);
        user.setAvatar(null);
        user.setAddress(null);
        user.setBankAccount(null);

        user.setRole(deletedRole);
        user.setActive(false);

        user.setCreditScore(0);
        user.setMemberTier(MemberTier.BRONZE);
        user.setTotalMatches(0);
        user.setTotalSpent(BigDecimal.ZERO);

        if (user.getExtraPermissions() != null) {
            user.getExtraPermissions().clear();
        }

        user.setDeletionReason(null);
        user.setDeletedAt(LocalDateTime.now());
        user.setAccountDeletionStatus(
                AccountDeletionStatus.COMPLETED
        );

        userRepository.saveAndFlush(user);
    }

    private int expireBookingIntentsOfUser(UUID userId) {
        return bookingIntentRepository
                .expireActiveIntentsByUserId(
                        userId,
                        BookingIntentStatus.ACTIVE,
                        BookingIntentStatus.EXPIRED,
                        LocalDateTime.now()
                );
    }
}
