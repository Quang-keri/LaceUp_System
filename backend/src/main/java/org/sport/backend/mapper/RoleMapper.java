package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.sport.backend.dto.request.role.RoleRequest;
import org.sport.backend.dto.response.role.RoleResponse;
import org.sport.backend.entity.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    RoleResponse toRoleResponse(Role role);

    Role toRole(RoleRequest request);
}
