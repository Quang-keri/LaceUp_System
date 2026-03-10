package org.sport.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.permission.PermissionRequest;
import org.sport.backend.dto.response.permission.PermissionResponse;
import org.sport.backend.service.PermissionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> getAllPermissions() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách quyền thành công", permissionService.getAllPermissions())
        );
    }

    @GetMapping("/{permissionId}")
    public ResponseEntity<ApiResponse<PermissionResponse>> getPermissionById(@PathVariable Integer permissionId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy thông tin quyền thành công", permissionService.getPermissionById(permissionId))
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PermissionResponse>> createPermission(@RequestBody @Valid PermissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success("Tạo quyền thành công", permissionService.createPermission(request))
        );
    }

    @PutMapping("/{permissionId}")
    public ResponseEntity<ApiResponse<PermissionResponse>> updatePermission(
            @PathVariable Integer permissionId,
            @RequestBody @Valid PermissionRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật quyền thành công", permissionService.updatePermission(permissionId, request))
        );
    }

    @DeleteMapping("/{permissionId}")
    public ResponseEntity<ApiResponse<Void>> deletePermission(@PathVariable Integer permissionId) {
        permissionService.deletePermission(permissionId);
        return ResponseEntity.ok(
                ApiResponse.success("Xóa quyền thành công", null)
        );
    }
}