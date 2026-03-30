package org.sport.backend.repository;

import org.sport.backend.entity.LegalProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LegalProfileRepository extends JpaRepository<LegalProfile, UUID> {
}
