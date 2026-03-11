package org.sport.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.dto.request.user.UpdateUserRequest;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/v1/users")
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
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách thành công", userService.getAllUsers())
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

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(
                ApiResponse.success("Xóa/Khóa người dùng thành công", null)
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