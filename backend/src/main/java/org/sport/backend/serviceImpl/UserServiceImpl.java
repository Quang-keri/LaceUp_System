package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.MemberTier;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.auth.ResetPasswordRequest;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.dto.request.user.UpdateUserRequest;
import org.sport.backend.dto.response.user.CategoryRankResponse;
import org.sport.backend.dto.response.user.ReputationLogResponse;
import org.sport.backend.dto.response.user.UserDashboardResponse;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.entity.*;
import org.sport.backend.entity.mongo.PasswordResetToken;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.mapper.UserMapper;
import org.sport.backend.properties.UrlProperties;
import org.sport.backend.repository.*;
import org.sport.backend.repository.mongo.PasswordResetTokenRepository;
import org.sport.backend.security.CustomUserDetails;
import org.sport.backend.service.EmailService;
import org.sport.backend.service.UserService;
import org.sport.backend.specification.UserSpecification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ReputationLogRepository reputationLogRepository;
    private final CategoryRepository categoryRepository;

    private final EmailService emailService;

    private final PasswordEncoder passwordEncoder;

    private final UserMapper userMapper;

    private final UrlProperties urlProperties;

    @Value("${token_reset_password_expire_seconds}")
    private long EXPIRATION_SEC;

    @Transactional
    @Override
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        Role role = roleRepository.findByRoleName(request.getRoleName())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User user = User.builder()
                .userName(request.getUserName())
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .gender(request.getGender())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .role(role)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        List<Category> allCategories = categoryRepository.findAll();

        List<UserCategoryRank> initialRanks = allCategories.stream().map(category ->
                UserCategoryRank.builder()
                        .user(user)
                        .category(category)
                        .rankPoint(0)
                        .currentWinStreak(0)
                        .totalWins(0)
                        .totalMatches(0)
                        .build()
        ).collect(Collectors.toList());

        user.setCategoryRanks(initialRanks);

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse getMyInfo() {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return userMapper.toUserResponse(
                userRepository.findByEmail(email).orElseThrow(
                        () -> new AppException(ErrorCode.USER_NOT_FOUND))
        );
    }

    @Override
    public PageResponse<UserResponse> getAllUsers(int page, int size, String role, Boolean active, String keyword) {

        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<User> spec = UserSpecification.filterUsers(keyword, role, active);

        Page<User> pageData = userRepository.findAll(spec, pageable);

        Page<UserResponse> responsePage = pageData.map(userMapper::toUserResponse);

        return PageResponse.<UserResponse>builder()
                .currentPage(page + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .data(responsePage.getContent())
                .build();
    }

    @Override
    public UserResponse getUserById(UUID userId) {
        User user = getUserEntity(userId);
        return userMapper.toUserResponse(user);
    }

    @Transactional
    @Override
    public UserResponse updateMyProfile(UpdateUserRequest request) {
        User user = getCurrentUserEntity();
        updateUserMethod(request, user);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    @Override
    public UserResponse updateUser(UUID userId, UpdateUserRequest request) {
        User user = getUserEntity(userId);
        updateUserMethod(request, user);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    private void updateUserMethod(UpdateUserRequest request, User user) {
        if (request.getUserName() != null) user.setUserName(request.getUserName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());

        boolean hasBankInfo = request.getBankName() != null ||
                request.getAccountNumber() != null ||
                request.getAccountHolderName() != null;

        if (hasBankInfo) {
            BankAccount bankAccount = user.getBankAccount();
            if (bankAccount == null) {
                bankAccount = new BankAccount();
                bankAccount.setUser(user);
            }

            if (request.getBankName() != null) bankAccount.setBankName(request.getBankName());
            if (request.getAccountNumber() != null) bankAccount.setAccountNumber(request.getAccountNumber());
            if (request.getAccountHolderName() != null) bankAccount.setAccountHolderName(request.getAccountHolderName());

            user.setBankAccount(bankAccount);
        }
    }

    @Override
    public void updateStatus(UUID id, Boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if ("ADMIN".equals(user.getRole().getRoleName())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        user.setActive(active);
        userRepository.save(user);
    }

    @Override
    public void processForgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            String token = createTokenResetPassword(email);
            String resetLink = urlProperties.getFrontend() + "/reset-password?token=" + token;
            emailService.sendResetPasswordEmail(email, resetLink);
        }
    }

    @Transactional
    @Override
    public void processResetPassword(ResetPasswordRequest request) {
        String email = validateTokenResetPassword(request.getToken());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        deleteTokenResetPassword(request.getToken());
    }

    @Override
    public Set<String> getUserAuthorities(UUID userId) {
        User user = getUserEntity(userId);
        Set<String> authorities = new HashSet<>();

        if (user.getRole() != null) {
            user.getRole().getPermissions().forEach(p -> authorities.add(p.getPermissionName()));
        }
        if (user.getExtraPermissions() != null) {
            user.getExtraPermissions().forEach(p -> authorities.add(p.getPermissionName()));
        }

        return authorities;
    }

    @Transactional
    @Override
    public UserResponse assignRole(UUID userId, Long roleId) {
        User user = getUserEntity(userId);
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role không tồn tại"));

        user.setRole(role);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    @Override
    public UserResponse addExtraPermissions(UUID userId, Set<Integer> permissionIds) {
        User user = getUserEntity(userId);
        List<Permission> permissions = permissionRepository.findAllById(permissionIds);

        if (user.getExtraPermissions() == null) {
            user.setExtraPermissions(new ArrayList<>());
        }

        user.getExtraPermissions().addAll(permissions);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    @Override
    public UserResponse removeExtraPermissions(UUID userId, Set<Integer> permissionIds) {
        User user = getUserEntity(userId);

        if (user.getExtraPermissions() != null && !user.getExtraPermissions().isEmpty()) {
            user.getExtraPermissions().removeIf(p -> permissionIds.contains(p.getPermissionId()));
        }

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserDashboardResponse getUserDashboard(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        int globalTotalMatches = 0;
        int globalTotalWins = 0;

        List<CategoryRankResponse> categoryRanksList = new ArrayList<>();

        for (UserCategoryRank rank : user.getCategoryRanks()) {
            globalTotalMatches += rank.getTotalMatches();
            globalTotalWins += rank.getTotalWins();

            double catWinRate = 0.0;
            if (rank.getTotalMatches() > 0) {
                catWinRate = Math.round(((double) rank.getTotalWins() / rank.getTotalMatches() * 100) * 10.0) / 10.0;
            }

            Integer leaderboardPosition = null;

            categoryRanksList.add(CategoryRankResponse.builder()
                    .categoryId(rank.getCategory().getCategoryId())
                    .categoryName(rank.getCategory().getCategoryName())
                    .rankPoint(rank.getRankPoint())
                    .displayRank(rank.resolveDisplayRank(leaderboardPosition))
                    .totalMatches(rank.getTotalMatches())
                    .totalWins(rank.getTotalWins())
                    .currentWinStreak(rank.getCurrentWinStreak())
                    .winRate(catWinRate)
                    .build());
        }

        double globalWinRate = 0.0;
        if (globalTotalMatches > 0) {
            globalWinRate = Math.round(((double) globalTotalWins / globalTotalMatches * 100) * 10.0) / 10.0;
        }

        return UserDashboardResponse.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
//                 .avatarUrl(user.getAvatarUrl())
                .totalMatches(globalTotalMatches)
                .totalWins(globalTotalWins)
                .winRate(globalWinRate)
                .categoryRanks(categoryRanksList)
                .build();
    }

    @Override
    public void verifyOwnerAccount() {
        User currentUser = getCurrentUserEntity();
        if (currentUser.getRole().getRoleName().equals("OWNER")
                || currentUser.getRole().getRoleName().equals("ADMIN")) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        Role roleOwner = roleRepository.findByRoleName("OWNER")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        currentUser.setRole(roleOwner);
        userRepository.save(currentUser);
    }

    @Override
    public User findByUserId(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Transactional
    @Override
    public UserResponse updateReputation(UUID userId, Integer points, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));

        user.setCreditScore(user.getCreditScore() + points);
        userRepository.save(user);

        ReputationLog log = ReputationLog.builder()
                .user(user)
                .pointsChanged(points)
                .reason(reason)
                .createdAt(LocalDateTime.now())
                .build();
        reputationLogRepository.save(log);

        return userMapper.toUserResponse(user);
    }

    @Override
    public PageResponse<UserResponse> getCustomersByOwner(int page, int size, String keyword, String tier, Integer minScore, Integer maxScore) {
        User owner = getCurrentUserEntity();
        Pageable pageable = PageRequest.of(page, size);
        MemberTier tierEnum = parseMemberTier(tier);

        Specification<User> spec = UserSpecification.filterCustomers(keyword, tierEnum, minScore, maxScore, owner.getUserId());

        Page<User> users = userRepository.findAll(spec, pageable);
        Page<UserResponse> responsePage = users.map(userMapper::toUserResponse);

        return PageResponse.<UserResponse>builder()
                .currentPage(page + 1)
                .totalPages(users.getTotalPages())
                .pageSize(users.getSize())
                .totalElements(users.getTotalElements())
                .data(responsePage.getContent())
                .build();
    }

    @Override
    public PageResponse<UserResponse> getAllCustomers(int page, int size, String keyword, String tier, Integer minScore, Integer maxScore) {
        Pageable pageable = PageRequest.of(page, size);
        MemberTier tierEnum = parseMemberTier(tier);

        Specification<User> spec = UserSpecification.filterCustomers(keyword, tierEnum, minScore, maxScore, null);

        Page<User> users = userRepository.findAll(spec, pageable);
        Page<UserResponse> responsePage = users.map(userMapper::toUserResponse);

        return PageResponse.<UserResponse>builder()
                .currentPage(page + 1)
                .totalPages(users.getTotalPages())
                .pageSize(users.getSize())
                .totalElements(users.getTotalElements())
                .data(responsePage.getContent())
                .build();
    }

    @Override
    public PageResponse<ReputationLogResponse> getReputationLogs(UUID userId, int page, int size) {

        userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<ReputationLog> logs = reputationLogRepository.findByUser_UserIdOrderByCreatedAtDesc(userId, pageable);

        List<ReputationLogResponse> logResponses = logs.getContent().stream()
                .map(log -> ReputationLogResponse.builder()
                        .id(log.getId())
                        .pointsChanged(log.getPointsChanged())
                        .reason(log.getReason())
                        .createdAt(log.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PageResponse.<ReputationLogResponse>builder()
                .currentPage(page + 1)
                .pageSize(size)
                .totalPages(logs.getTotalPages())
                .totalElements(logs.getTotalElements())
                .data(logResponses)
                .build();
    }

    @Override
    public User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.USER_NOT_AUTHENTICATED);
        }

        Object principal = authentication.getPrincipal();
        String email;

        if (principal instanceof CustomUserDetails customUserDetails) {
            email = customUserDetails.getUsername();
        } else if (principal instanceof String) {
            email = authentication.getName();
        } else {
            throw new AppException(ErrorCode.USER_NOT_AUTHENTICATED);
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    public User getCurrentUserEntityOrNull() {
        try {
            return getCurrentUserEntity();
        } catch (Exception e) {
            return null;
        }
    }

    private User getUserEntity(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private String createTokenResetPassword(String email) {
        passwordResetTokenRepository.deleteByEmail(email);

        String tokenString = UUID.randomUUID().toString();

        Instant expiryDate = Instant.now().plusSeconds(EXPIRATION_SEC);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .email(email)
                .token(tokenString)
                .expiryDate(expiryDate)
                .build();

        passwordResetTokenRepository.save(resetToken);

        return tokenString;
    }

    private String validateTokenResetPassword(String token) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ hoặc không tồn tại"));

        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException("Token đã hết hạn");
        }

        return resetToken.getEmail();
    }

    private void deleteTokenResetPassword(String token) {
        passwordResetTokenRepository.findByToken(token)
                .ifPresent(passwordResetTokenRepository::delete);
    }

    private MemberTier parseMemberTier(String tier) {
        if (tier == null || tier.trim().isEmpty()) {
            return null;
        }
        try {
            return MemberTier.valueOf(tier.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Hạng thành viên không hợp lệ: " + tier);
        }
    }
}