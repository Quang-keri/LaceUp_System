package org.sport.backend.repository;

import org.sport.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role r LEFT JOIN FETCH r.permissions LEFT JOIN FETCH u.extraPermissions WHERE u.email = :email")
    Optional<User> findByEmailWithRoleAndPermissions(@Param("email") String email);

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

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :startDate AND :endDate")
    Long countNewUsers(LocalDateTime startDate, LocalDateTime endDate);
}
