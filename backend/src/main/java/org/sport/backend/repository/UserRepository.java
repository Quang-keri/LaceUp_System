package org.sport.backend.repository;

import org.jspecify.annotations.NonNull;
import org.sport.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = {"role", "role.permissions", "extraPermissions"})
    Optional<User> findDetailedByEmail(String email);

    boolean existsByEmail(String email);

    @NonNull
    Page<User> findAll(
            Specification<User> spec,
            @NonNull Pageable pageable);

    Long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

}