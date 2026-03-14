package org.sport.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.role.RoleRequest;
import org.sport.backend.dto.response.role.RoleResponse;
import org.sport.backend.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    // --- CRUD APIs ---

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách Role thành công", roleService.getAllRoles())
        );
    }

    @GetMapping("/{roleId}")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(@PathVariable Long roleId) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy thông tin Role thành công", roleService.getRoleById(roleId))
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(@RequestBody @Valid RoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success("Tạo Role thành công", roleService.createRole(request))
        );
    }

    @PutMapping("/{roleId}")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRole(
            @PathVariable Long roleId,
            @RequestBody @Valid RoleRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật Role thành công", roleService.updateRole(roleId, request))
        );
    }

    @PatchMapping("/{roleId}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long roleId,
            @RequestBody boolean active) {
        roleService.updateStatus(roleId, active);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", null));
    }

    // --- Role-Permission APIs ---

    @PostMapping("/{roleId}/permissions")
    public ResponseEntity<ApiResponse<RoleResponse>> addPermissionsToRole(
            @PathVariable Long roleId,
            @RequestBody Set<Integer> permissionIds) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success("Thêm quyền vào Role thành công", roleService.addPermissionsToRole(roleId, permissionIds))
        );
    }

    @DeleteMapping("/{roleId}/permissions")
    public ResponseEntity<ApiResponse<RoleResponse>> removePermissionsFromRole(
            @PathVariable Long roleId,
            @RequestBody Set<Integer> permissionIds) {
        return ResponseEntity.ok(
                ApiResponse.success("Xóa quyền khỏi Role thành công", roleService.removePermissionsFromRole(roleId, permissionIds))
        );
    }
}