package org.sport.backend.repository;

import org.sport.backend.entity.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NewsRepository extends JpaRepository<News, UUID>,
        JpaSpecificationExecutor<News> {

    Page<News> findByCreatedBy_UserId(UUID userId, Pageable pageable);

    long countByCreatedBy_UserId(UUID userId);
}