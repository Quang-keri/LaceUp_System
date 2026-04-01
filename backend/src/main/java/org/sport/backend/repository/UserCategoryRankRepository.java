package org.sport.backend.repository;

import org.sport.backend.entity.UserCategoryRank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCategoryRankRepository extends JpaRepository<UserCategoryRank, UUID> {
    Optional<UserCategoryRank> findByUser_UserIdAndCategory_CategoryId(UUID userId, Integer categoryId);
}