package org.sport.backend.repository;

import org.rent.room.be.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AmenityRepository extends JpaRepository<Amenity, Long> {
    boolean existsByAmenityName(String amenityName);
    Optional<Amenity> findByAmenityName(String amenityName);
}
