package org.sport.backend.repository;

import org.sport.backend.entity.Court;
import org.sport.backend.entity.CourtImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourtImageRepository extends JpaRepository<CourtImage, UUID> {

    List<CourtImage> findByCourt_CourtId(UUID courtId);
    List<CourtImage> findByCourt(Court court);
}