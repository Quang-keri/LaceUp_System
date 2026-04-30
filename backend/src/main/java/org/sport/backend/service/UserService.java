package org.sport.backend.service;

import jakarta.transaction.Transactional;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.auth.ResetPasswordRequest;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.dto.request.user.UpdateUserRequest;
import org.sport.backend.dto.response.user.UserDashboardResponse;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.entity.User;

import java.util.Set;
import java.util.UUID;

public interface UserService {

    @Transactional
    UserResponse createUser(CreateUserRequest request);

    UserResponse getMyInfo();

    PageResponse<UserResponse> getAllUsers(int page, int size, String role, Boolean active, String keyword);

    UserResponse getUserById(UUID userId);

    @Transactional
    UserResponse updateUser(UUID userId, UpdateUserRequest request);

    void updateStatus(UUID id, Boolean active);

    void processForgotPassword(String email);

    void processResetPassword(ResetPasswordRequest request);

    Set<String> getUserAuthorities(UUID userId);

    @Transactional
    UserResponse assignRole(UUID userId, Long roleId);

    @Transactional
    UserResponse addExtraPermissions(UUID userId, Set<Integer> permissionIds);

    @Transactional
    UserResponse removeExtraPermissions(UUID userId, Set<Integer> permissionIds);

    User findByUserId(UUID id);

    User findByEmail(String email);

    User getCurrentUserEntity();

    UserDashboardResponse getUserDashboard(UUID userId);

    void verifyOwnerAccount();
}
