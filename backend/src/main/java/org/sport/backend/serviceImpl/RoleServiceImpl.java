package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.request.role.RoleRequest;
import org.sport.backend.dto.response.role.RoleResponse;
import org.sport.backend.entity.Permission;
import org.sport.backend.entity.Role;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode; // Đảm bảo có ROLE_NOT_FOUND
import org.sport.backend.mapper.RoleMapper;
import org.sport.backend.repository.PermissionRepository;
import org.sport.backend.repository.RoleRepository;
import org.sport.backend.service.RoleService;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RoleMapper roleMapper;

    @Override
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toRoleResponse)
                .collect(Collectors.toList());
    }

    @Override
    public RoleResponse getRoleById(Long roleId) {
        return roleMapper.toRoleResponse(getRoleEntity(roleId));
    }

    @Transactional
    @Override
    public RoleResponse createRole(RoleRequest request) {
        if (roleRepository.existsByRoleName(request.getRoleName())) {
            throw new RuntimeException("Tên Role đã tồn tại"); // Đổi thành AppException
        }
        Role role = roleMapper.toRole(request);
        role.setActive(true);
        // Khởi tạo set rỗng để tránh NullPointerException khi add permission sau này
        role.setPermissions(new HashSet<>());

        return roleMapper.toRoleResponse(roleRepository.save(role));
    }

    @Transactional
    @Override
    public RoleResponse updateRole(Long roleId, RoleRequest request) {
        Role role = getRoleEntity(roleId);
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        return roleMapper.toRoleResponse(roleRepository.save(role));
    }

    @Transactional
    @Override
    public void deleteRole(Long roleId) {
        Role role = getRoleEntity(roleId);
        role.setActive(false); // Soft delete
        roleRepository.save(role);
    }

    // --- FEATURE 1: Thêm/Xóa Permissions cho Role ---

    @Transactional
    @Override
    public RoleResponse addPermissionsToRole(Long roleId, Set<Integer> permissionIds) {
        Role role = getRoleEntity(roleId);
        List<Permission> permissions = permissionRepository.findAllById(permissionIds);

        role.getPermissions().addAll(permissions);
        return roleMapper.toRoleResponse(roleRepository.save(role));
    }

    @Transactional
    @Override
    public RoleResponse removePermissionsFromRole(Long roleId, Set<Integer> permissionIds) {
        Role role = getRoleEntity(roleId);
        if (role.getPermissions() != null && !role.getPermissions().isEmpty()) {
            role.getPermissions().removeIf(p -> permissionIds.contains(p.getPermissionId()));
        }
        return roleMapper.toRoleResponse(roleRepository.save(role));
    }

    // Helper method
    private Role getRoleEntity(Long roleId) {
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
    }
}