package org.sport.backend.repository;


import org.sport.backend.entity.RentalArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RentalAreaRepository extends JpaRepository<RentalArea, UUID>, JpaSpecificationExecutor<RentalArea> {
}
