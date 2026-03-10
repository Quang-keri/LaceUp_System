package org.sport.backend.service;

import jakarta.transaction.Transactional;
import org.sport.backend.dto.request.permission.PermissionRequest;
import org.sport.backend.dto.response.permission.PermissionResponse;

import java.util.List;

public interface PermissionService {
    List<PermissionResponse> getAllPermissions();

    PermissionResponse getPermissionById(Integer permissionId);

    @Transactional
    PermissionResponse createPermission(PermissionRequest request);

    @Transactional
    PermissionResponse updatePermission(Integer permissionId, PermissionRequest request);

    @Transactional
    void deletePermission(Integer permissionId);
}
