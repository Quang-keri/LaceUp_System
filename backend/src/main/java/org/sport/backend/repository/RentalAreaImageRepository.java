package org.sport.backend.repository;

import org.sport.backend.entity.RentalArea;
import org.sport.backend.entity.RentalAreaImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RentalAreaImageRepository extends JpaRepository<RentalAreaImage, UUID> {

    List<RentalAreaImage> findByRentalArea(RentalArea rentalArea);
}
