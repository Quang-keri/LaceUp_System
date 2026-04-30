package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.auth.ResetPasswordRequest;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.dto.request.user.UpdateUserRequest;
import org.sport.backend.dto.response.user.CategoryRankResponse;
import org.sport.backend.dto.response.user.UserDashboardResponse;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.entity.Permission;
import org.sport.backend.entity.Role;
import org.sport.backend.entity.User;
import org.sport.backend.entity.UserCategoryRank;
import org.sport.backend.entity.mongo.PasswordResetToken;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.mapper.UserMapper;
import org.sport.backend.repository.PermissionRepository;
import org.sport.backend.repository.RoleRepository;
import org.sport.backend.repository.UserRepository;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private final UserMapper userMapper;

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
    public UserResponse updateUser(UUID userId, UpdateUserRequest request) {
        User user = getUserEntity(userId);

        if (request.getUserName() != null) user.setUserName(request.getUserName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());

        return userMapper.toUserResponse(userRepository.save(user));
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
            String resetLink = "http://localhost:5173/reset-password?token=" + token;
            emailService.sendResetPasswordEmail(email, resetLink);
        }
    }

    @Transactional
    @Override
    public void processResetPassword(ResetPasswordRequest request) {
        // 1. Validate token bên Mongo -> Lấy ra email
        String email = validateTokenResetPassword(request.getToken());

        // 2. Tìm user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // 3. Mã hóa và cập nhật mật khẩu mới
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 4. Xóa token để không dùng lại được nữa
        deleteTokenResetPassword(request.getToken());
    }

    // --- RBAC & PERMISSION LOGIC ---

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

        // Khắc phục lỗi NullPointerException
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

        // Các biến dùng để cộng dồn thống kê tổng quan
        int globalTotalMatches = 0;
        int globalTotalWins = 0;

        List<CategoryRankResponse> categoryRanksList = new ArrayList<>();

        // Duyệt qua từng rank của người dùng
        for (UserCategoryRank rank : user.getCategoryRanks()) {
            // Cộng dồn vào biến tổng
            globalTotalMatches += rank.getTotalMatches();
            globalTotalWins += rank.getTotalWins();

            // Tính tỉ lệ thắng riêng cho môn thể thao này
            double catWinRate = 0.0;
            if (rank.getTotalMatches() > 0) {
                catWinRate = Math.round(((double) rank.getTotalWins() / rank.getTotalMatches() * 100) * 10.0) / 10.0;
            }

            Integer leaderboardPosition = null; // Thêm logic lấy vị trí bảng xếp hạng nếu cần

            // Thêm vào danh sách trả về
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

        // Tính tỉ lệ thắng tổng quan cho toàn bộ tài khoản
        double globalWinRate = 0.0;
        if (globalTotalMatches > 0) {
            globalWinRate = Math.round(((double) globalTotalWins / globalTotalMatches * 100) * 10.0) / 10.0;
        }

        // Trả kết quả về cho Controller
        return UserDashboardResponse.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                // .avatarUrl(user.getAvatarUrl())

                // Stats tổng quan đã được cộng dồn
                .totalMatches(globalTotalMatches)
                .totalWins(globalTotalWins)
                .winRate(globalWinRate)

                // Danh sách chi tiết
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
            // Thông thường getName() sẽ là email do JwtAuthenticationFilter set
            email = authentication.getName();
        } else {
            throw new AppException(ErrorCode.USER_NOT_AUTHENTICATED);
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private User getUserEntity(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private String createTokenResetPassword(String email) {
        passwordResetTokenRepository.deleteByEmail(email);

        String tokenString = UUID.randomUUID().toString();

        // 3. Tính thời gian hết hạn
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

        // Kiểm tra hết hạn thủ công (đề phòng MongoDB chưa kịp xóa background)
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
}