package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.sport.backend.dto.request.permission.PermissionRequest;
import org.sport.backend.dto.response.permission.PermissionResponse;
import org.sport.backend.entity.Permission;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    PermissionResponse toPermissionResponse(Permission permission);
    Permission toPermission(PermissionRequest request);
}