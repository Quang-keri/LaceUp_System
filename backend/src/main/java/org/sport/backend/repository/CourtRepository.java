package org.sport.backend.repository;


import org.sport.backend.entity.Court;
import org.sport.backend.entity.RentalArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourtRepository extends JpaRepository<Court, UUID>, JpaSpecificationExecutor<Court> {
    List<Court> findByRentalArea(RentalArea rentalArea);

    List<Court> findAllByRentalArea(RentalArea area);
}
