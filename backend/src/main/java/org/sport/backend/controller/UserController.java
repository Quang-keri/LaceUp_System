package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.dto.request.user.UpdateUserRequest;
import org.sport.backend.dto.request.user.UpdateUserStatusRequest;
import org.sport.backend.dto.response.user.UserDashboardResponse;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "2. User")
public class UserController {

    private final UserService userService;

    @GetMapping("/my-info")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo() {
        return ResponseEntity.ok(
                ApiResponse.
                        success(200,
                                "Lấy thông tin cá nhân thành công",
                                userService.getMyInfo())
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_USER')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @RequestBody @Valid CreateUserRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(201,
                        "Tạo người dùng thành công",
                        userService.createUser(request))
        );
    }

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_USERS')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<UserResponse>>builder()
                        .code(200)
                        .message("Get users success")
                        .result(userService.getAllUsers(page - 1, size, role, active, keyword))
                        .build()
        );
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('VIEW_USER_DETAIL')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(
                ApiResponse.success(userService.getUserById(userId))
        );
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('UPDATE_USER')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID userId,
            @RequestBody @Valid UpdateUserRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật thành công",
                        userService.updateUser(userId, request))
        );
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_USER_STATUS')")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest statusRequest) {
        userService.updateStatus(id, statusRequest.getStatus());
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code(200)
                        .message("Update status user successfully")
                        .build()
        );
    }

    @PutMapping("/{userId}/role/{roleId}")
    @PreAuthorize("hasAuthority('ASSIGN_ROLE')")
    public ResponseEntity<ApiResponse<UserResponse>> assignRoleToUser(
            @PathVariable UUID userId,
            @PathVariable Long roleId) {
        return ResponseEntity.ok(
                ApiResponse.success("Gán Role thành công",
                        userService.assignRole(userId, roleId))
        );
    }

    @PostMapping("/{userId}/extra-permissions")
    @PreAuthorize("hasAuthority('GRANT_EXTRA_PERMISSION')")
    public ResponseEntity<ApiResponse<UserResponse>> addExtraPermissionsToUser(
            @PathVariable UUID userId,
            @RequestBody Set<Integer> permissionIds) {
        return ResponseEntity.ok(
                ApiResponse.success("Thêm quyền riêng thành công",
                        userService.addExtraPermissions(userId, permissionIds))
        );
    }

    @DeleteMapping("/{userId}/extra-permissions")
    @PreAuthorize("hasAuthority('REVOKE_EXTRA_PERMISSION')")
    public ResponseEntity<ApiResponse<UserResponse>> removeExtraPermissionsFromUser(
            @PathVariable UUID userId,
            @RequestBody Set<Integer> permissionIds) {
        return ResponseEntity.ok(
                ApiResponse.success("Xóa quyền riêng thành công",
                        userService.removeExtraPermissions(userId, permissionIds))
        );
    }

    @GetMapping("/{userId}/authorities")
    @PreAuthorize("hasAuthority('VIEW_USER_AUTHORITIES')")
    public ResponseEntity<ApiResponse<Set<String>>> getUserAuthorities(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách quyền thành công",
                        userService.getUserAuthorities(userId))
        );
    }

    @GetMapping("/{userId}/dashboard")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDashboardResponse>> getUserDashboard(
            @PathVariable UUID userId) {
        log.info("Lấy thông tin dashboard thống kê của user: {}", userId);
        UserDashboardResponse response = userService.getUserDashboard(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

}