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
import org.sport.backend.dto.response.user.ReputationLogResponse;
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
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Lấy thông tin cá nhân thành công")
                        .result(userService.getMyInfo())
                        .build()
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_USER')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @RequestBody @Valid CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<UserResponse>builder()
                        .code(201)
                        .message("Tạo tài khoản người dùng thành công")
                        .result(userService.createUser(request))
                        .build()
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
                        .message("Lấy danh sách người dùng thành công")
                        .result(userService.getAllUsers(page - 1, size, role, active, keyword))
                        .build()
        );
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAuthority('VIEW_USER_DETAIL')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Lấy chi tiết người dùng thành công")
                        .result(userService.getUserById(userId))
                        .build()
        );
    }

    @PutMapping("/my-info")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> updateMyProfile(
            @RequestBody @Valid UpdateUserRequest request) {

        log.info("User đang tự cập nhật thông tin cá nhân");

        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Cập nhật thông tin cá nhân thành công")
                        .result(userService.updateMyProfile(request))
                        .build()
        );
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAuthority('UPDATE_USER')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID userId,
            @RequestBody @Valid UpdateUserRequest request) {
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Cập nhật thông tin người dùng thành công")
                        .result(userService.updateUser(userId, request))
                        .build()
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
                        .message("Cập nhật trạng thái người dùng thành công")
                        .build()
        );
    }

    @PutMapping("/{userId}/role/{roleId}")
    @PreAuthorize("hasAuthority('ASSIGN_ROLE')")
    public ResponseEntity<ApiResponse<UserResponse>> assignRoleToUser(
            @PathVariable UUID userId,
            @PathVariable Long roleId) {
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Gán vai trò (Role) cho người dùng thành công")
                        .result(userService.assignRole(userId, roleId))
                        .build()
        );
    }

    @PostMapping("/{userId}/extra-permissions")
    @PreAuthorize("hasAuthority('GRANT_EXTRA_PERMISSION')")
    public ResponseEntity<ApiResponse<UserResponse>> addExtraPermissionsToUser(
            @PathVariable UUID userId,
            @RequestBody Set<Integer> permissionIds) {
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Thêm quyền riêng cho người dùng thành công")
                        .result(userService.addExtraPermissions(userId, permissionIds))
                        .build()
        );
    }

    @DeleteMapping("/{userId}/extra-permissions")
    @PreAuthorize("hasAuthority('REVOKE_EXTRA_PERMISSION')")
    public ResponseEntity<ApiResponse<UserResponse>> removeExtraPermissionsFromUser(
            @PathVariable UUID userId,
            @RequestBody Set<Integer> permissionIds) {
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Xóa quyền riêng của người dùng thành công")
                        .result(userService.removeExtraPermissions(userId, permissionIds))
                        .build()
        );
    }

    @GetMapping("/{userId}/authorities")
    @PreAuthorize("hasAuthority('VIEW_USER_AUTHORITIES')")
    public ResponseEntity<ApiResponse<Set<String>>> getUserAuthorities(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(
                ApiResponse.<Set<String>>builder()
                        .code(200)
                        .message("Lấy danh sách quyền của người dùng thành công")
                        .result(userService.getUserAuthorities(userId))
                        .build()
        );
    }

    @GetMapping("/{userId}/dashboard")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDashboardResponse>> getUserDashboard(
            @PathVariable UUID userId) {
        log.info("Lấy thông tin dashboard thống kê của user: {}", userId);
        return ResponseEntity.ok(
                ApiResponse.<UserDashboardResponse>builder()
                        .code(200)
                        .message("Lấy bảng thống kê người dùng thành công")
                        .result(userService.getUserDashboard(userId))
                        .build()
        );
    }

    @PostMapping("/{id}/reputation")
    @PreAuthorize("hasAuthority('UPDATE_CUSTOMER_REPUTTION')")
    public ResponseEntity<ApiResponse<UserResponse>> updateReputation(
            @PathVariable UUID id,
            @RequestParam Integer points,
            @RequestParam String reason) {
        return ResponseEntity.ok(
                ApiResponse.<UserResponse>builder()
                        .code(200)
                        .message("Cập nhật điểm uy tín thành công")
                        .result(userService.updateReputation(id, points, reason))
                        .build()
        );
    }

    @GetMapping("/my-customers")
    @PreAuthorize("hasAuthority('VIEW_CUSTOMER')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getMyCustomers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) Integer maxScore) {

        return ResponseEntity.ok(
                ApiResponse.<PageResponse<UserResponse>>builder()
                        .code(200)
                        .message("Lấy danh sách khách hàng thành công")
                        .result(userService.getCustomersByOwner(page - 1, size, keyword, tier, minScore, maxScore))
                        .build()
        );
    }

    @GetMapping("/customers")
    @PreAuthorize("hasAuthority('VIEW_CUSTOMER')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllCustomersForAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) Integer maxScore) {

        return ResponseEntity.ok(
                ApiResponse.<PageResponse<UserResponse>>builder()
                        .code(200)
                        .message("Lấy toàn bộ danh sách khách hàng thành công")
                        .result(userService.getAllCustomers(page - 1, size, keyword, tier, minScore, maxScore))
                        .build()
        );
    }

    @GetMapping("/{id}/reputation-logs")
    @PreAuthorize("hasAuthority('VIEW_CUSTOMER_DETAIL')")
    public ResponseEntity<ApiResponse<PageResponse<ReputationLogResponse>>> getReputationLogs(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(
                ApiResponse.<PageResponse<ReputationLogResponse>>builder()
                        .code(200)
                        .message("Lấy lịch sử thay đổi uy tín thành công")
                        .result(userService.getReputationLogs(id, page - 1, size))
                        .build()
        );
    }
}