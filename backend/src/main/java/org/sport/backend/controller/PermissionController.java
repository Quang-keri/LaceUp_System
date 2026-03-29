package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.permission.PermissionRequest;
import org.sport.backend.dto.response.permission.PermissionResponse;
import org.sport.backend.service.PermissionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@Tag(name = "4. Permission")
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_PERMISSIONS')")
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy danh sách quyền thành công",
                        permissionService.getAllPermissions())
        );
    }

    @GetMapping("/{permissionId}")
    @PreAuthorize("hasAuthority('VIEW_PERMISSIONS')")
    public ResponseEntity<ApiResponse<PermissionResponse>> getPermissionById(
            @PathVariable Integer permissionId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy thông tin quyền thành công",
                        permissionService.getPermissionById(permissionId))
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_PERMISSION')")
    public ResponseEntity<ApiResponse<PermissionResponse>> createPermission(
            @RequestBody @Valid PermissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        201,
                        "Tạo quyền thành công",
                        permissionService.createPermission(request))
        );
    }

    @PutMapping("/{permissionId}")
    @PreAuthorize("hasAuthority('UPDATE_PERMISSION')")
    public ResponseEntity<ApiResponse<Void>> updatePermission(
            @PathVariable Integer permissionId,
            @RequestBody @Valid PermissionRequest request) {
        permissionService.updatePermission(permissionId, request);
        return ResponseEntity.ok(
                ApiResponse.success(
                        204,
                        "Cập nhật quyền thành công",
                        null)
        );
    }

    @DeleteMapping("/{permissionId}")
    @PreAuthorize("hasAuthority('DELETE_PERMISSION')")
    public ResponseEntity<ApiResponse<Void>> deletePermission(
            @PathVariable Integer permissionId) {
        permissionService.deletePermission(permissionId);
        return ResponseEntity.ok(
                ApiResponse.success(
                        204,
                        "Xóa quyền thành công",
                        null)
        );
    }
}