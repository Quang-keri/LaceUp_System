package org.sport.backend.serviceImpl;

import org.sport.backend.service.PermissionService;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.request.permission.PermissionRequest;
import org.sport.backend.dto.response.permission.PermissionResponse;
import org.sport.backend.entity.Permission;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.mapper.PermissionMapper;
import org.sport.backend.repository.PermissionRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionMapper permissionMapper;

    @Override
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(permissionMapper::toPermissionResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PermissionResponse getPermissionById(Integer permissionId) {
        return permissionMapper.toPermissionResponse(getPermissionEntity(permissionId));
    }

    @Transactional
    @Override
    public PermissionResponse createPermission(PermissionRequest request) {
        if (permissionRepository.existsByPermissionName(request.getPermissionName())) {
            throw new RuntimeException("Tên quyền đã tồn tại"); // Thay bằng AppException
        }

        Permission permission = permissionMapper.toPermission(request);
        return permissionMapper.toPermissionResponse(permissionRepository.save(permission));
    }

    @Transactional
    @Override
    public PermissionResponse updatePermission(Integer permissionId, PermissionRequest request) {
        Permission permission = getPermissionEntity(permissionId);

        if (!permission.getPermissionName().equals(request.getPermissionName()) &&
                permissionRepository.existsByPermissionName(request.getPermissionName())) {
            throw new AppException(ErrorCode.PERMISSION_EXISTED);
        }

        permission.setPermissionName(request.getPermissionName());
        permission.setDescription(request.getDescription());

        return permissionMapper.toPermissionResponse(permissionRepository.save(permission));
    }

    @Transactional
    @Override
    public void deletePermission(Integer permissionId) {
        Permission permission = getPermissionEntity(permissionId);
        // Xóa cứng khỏi DB
        permissionRepository.delete(permission);
    }

    private Permission getPermissionEntity(Integer permissionId) {
        return permissionRepository.findById(permissionId)
                .orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_FOUND));
    }
}
