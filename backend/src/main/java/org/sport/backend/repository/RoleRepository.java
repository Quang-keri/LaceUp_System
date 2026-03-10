package org.sport.backend.repository;

import jakarta.validation.constraints.NotNull;
import org.sport.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    List<Role> findAllByActiveTrue();

    Optional<Role> findByRoleName(@NotNull(message = "ROLE_REQUIRED") String roleName);
}