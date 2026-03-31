package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.sport.backend.dto.base.ApiResponse;
import org.sport.backend.dto.request.role.RoleRequest;
import org.sport.backend.dto.response.role.RoleResponse;
import org.sport.backend.service.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@Tag(name = "3. Role")
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_ROLES')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy danh sách Role thành công",
                        roleService.getAllRoles())
        );
    }

    @GetMapping("/{roleId}")
    @PreAuthorize("hasAuthority('VIEW_ROLES')")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleById(
            @PathVariable Long roleId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Lấy thông tin Role thành công",
                        roleService.getRoleById(roleId))
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_ROLE')")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(
            @RequestBody @Valid RoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        201,
                        "Tạo Role thành công",
                        roleService.createRole(request))
        );
    }

    @PutMapping("/{roleId}")
    @PreAuthorize("hasAuthority('UPDATE_ROLE')")
    public ResponseEntity<ApiResponse<Void>> updateRole(
            @PathVariable Long roleId,
            @RequestBody @Valid RoleRequest request) {
        roleService.updateRole(roleId, request);
        return ResponseEntity.ok(
                ApiResponse.success(
                        204,
                        "Cập nhật Role thành công",
                        null)
        );
    }

    @PatchMapping("/{roleId}/status")
    @PreAuthorize("hasAuthority('UPDATE_ROLE')")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long roleId,
            @RequestBody boolean active) {
        roleService.updateStatus(roleId, active);
        return ResponseEntity.ok(
                ApiResponse.success(
                        204,
                        "Cập nhật trạng thái thành công",
                        null));
    }

    @PutMapping("/{roleId}/permissions")
    @PreAuthorize("hasAuthority('MANAGE_ROLE_PERMISSIONS')")
    public ResponseEntity<ApiResponse<RoleResponse>> updatePermissionsOfRole(
            @PathVariable Long roleId,
            @RequestBody Set<Integer> permissionIds) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        200,
                        "Cập nhật danh sách quyền thành công",
                        roleService.updatePermissionsOfRole(roleId, permissionIds))
        );
    }
}