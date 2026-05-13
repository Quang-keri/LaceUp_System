package org.sport.backend.repository;

import org.sport.backend.entity.CommissionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommissionConfigRepository extends JpaRepository<CommissionConfig, UUID> {

    Optional<CommissionConfig> findByIsDefaultTrue();

    Optional<CommissionConfig> findFirstByRentalArea_RentalAreaIdAndIsActiveTrue(UUID rentalAreaId);

    @Query("""
        SELECT c
        FROM CommissionConfig c
        WHERE c.rentalArea.rentalAreaId = :rentalAreaId
        AND c.isActive = true
        AND (
            (c.minBookings IS NULL OR c.minBookings <= :bookingCount)
            AND (c.maxBookings IS NULL OR c.maxBookings >= :bookingCount)
        )
        ORDER BY c.minBookings DESC
    """)
    Optional<CommissionConfig> findApplicableConfigForRentalArea(
            UUID rentalAreaId,
            int bookingCount
    );
}