package org.sport.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.base.PageResponse;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.dto.request.user.UpdateUserRequest;
import org.sport.backend.dto.request.user.UpdateUserStatusRequest;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // --- GET ME API ---
    @GetMapping("/my-info")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy thông tin cá nhân thành công", userService.getMyInfo())
        );
    }

    // --- CRUD APIs ---
    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@RequestBody @Valid CreateUserRequest request) {
        // HTTP 201 Created là chuẩn RESTful cho việc tạo mới
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success("Tạo người dùng thành công", userService.createUser(request))
        );
    }

    @GetMapping
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
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(
                ApiResponse.success(userService.getUserById(userId))
        );
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID userId,
            @RequestBody @Valid UpdateUserRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật thành công", userService.updateUser(userId, request))
        );
    }

    @PatchMapping("/{id}")
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

    // --- RBAC APIs ---
    @PutMapping("/{userId}/role/{roleId}")
    public ResponseEntity<ApiResponse<UserResponse>> assignRoleToUser(
            @PathVariable UUID userId,
            @PathVariable Long roleId) {
        return ResponseEntity.ok(
                ApiResponse.success("Gán Role thành công", userService.assignRole(userId, roleId))
        );
    }

    @PostMapping("/{userId}/extra-permissions")
    public ResponseEntity<ApiResponse<UserResponse>> addExtraPermissionsToUser(
            @PathVariable UUID userId,
            @RequestBody Set<Integer> permissionIds) {
        return ResponseEntity.ok(
                ApiResponse.success("Thêm quyền riêng thành công", userService.addExtraPermissions(userId, permissionIds))
        );
    }

    @DeleteMapping("/{userId}/extra-permissions")
    public ResponseEntity<ApiResponse<UserResponse>> removeExtraPermissionsFromUser(
            @PathVariable UUID userId,
            @RequestBody Set<Integer> permissionIds) {
        return ResponseEntity.ok(
                ApiResponse.success("Xóa quyền riêng thành công", userService.removeExtraPermissions(userId, permissionIds))
        );
    }

    @GetMapping("/{userId}/authorities")
    public ResponseEntity<ApiResponse<Set<String>>> getUserAuthorities(@PathVariable UUID userId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách quyền thành công", userService.getUserAuthorities(userId))
        );
    }
}