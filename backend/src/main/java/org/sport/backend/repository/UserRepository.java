package org.sport.backend.repository;

import org.sport.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    Page<User> findAll(Specification<User> spec, Pageable pageable);

    @Query(value = """
    SELECT rank_position FROM (
        SELECT user_id, 
               RANK() OVER (ORDER BY rank_point DESC) as rank_position 
        FROM users 
        WHERE rank_point >= 3000
    ) as ranked_users 
    WHERE user_id = :userId
    """, nativeQuery = true)
    Integer findLeaderboardPositionByUserId(@Param("userId") UUID userId);

    Long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    Page<User> findAllByRole_RoleName(String roleName, Pageable pageable);

}