package org.sport.backend.repository;

import org.rent.room.be.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {
    boolean existsByCityName(String cityName);
    Optional<City> findByCityName(String cityName);
    List<City> findAllByOrderByCityIdAsc();
}
