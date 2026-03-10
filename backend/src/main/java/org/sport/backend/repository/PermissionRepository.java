package org.sport.backend.repository;

import jakarta.validation.constraints.NotBlank;
import org.sport.backend.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Integer> {
    boolean existsByPermissionName(@NotBlank(message = "PERMISSION_NAME_REQUIRED") String permissionName);
}
