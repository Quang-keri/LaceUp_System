package org.sport.backend.repository;

import org.sport.backend.entity.ReputationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReputationLogRepository extends JpaRepository<ReputationLog, Long> {

    Page<ReputationLog> findByUser_UserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);}