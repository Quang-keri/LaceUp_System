package org.sport.backend.repository;

import org.sport.backend.entity.CommissionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommissionConfigRepository extends JpaRepository<CommissionConfig, UUID> {

    Optional<CommissionConfig> findByIsDefaultTrue();


    @Query("SELECT c FROM CommissionConfig c " +
            "WHERE c.rentalArea.rentalAreaId = :rentalAreaId " +
            "AND c.minBookings <= :bookingCount " +
            "AND (c.maxBookings >= :bookingCount OR c.maxBookings IS NULL)")
    Optional<CommissionConfig> findApplicableConfigForRentalArea(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("bookingCount") int bookingCount);
}
