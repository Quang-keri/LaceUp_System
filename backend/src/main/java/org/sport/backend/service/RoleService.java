package org.sport.backend.service;

import jakarta.transaction.Transactional;
import org.sport.backend.dto.request.role.RoleRequest;
import org.sport.backend.dto.response.role.RoleResponse;

import java.util.List;
import java.util.Set;

public interface RoleService {
    List<RoleResponse> getAllRoles();

    RoleResponse getRoleById(Long roleId);

    @Transactional
    RoleResponse createRole(RoleRequest request);

    @Transactional
    void updateRole(Long roleId, RoleRequest request);

    void updateStatus(Long roleId, boolean active);

    @Transactional
    RoleResponse updatePermissionsOfRole(Long roleId, Set<Integer> permissionIds);
}
