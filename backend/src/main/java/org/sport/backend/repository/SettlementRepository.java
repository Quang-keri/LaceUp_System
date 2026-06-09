package org.sport.backend.repository;

import org.sport.backend.constant.SettlementStatus;
import org.sport.backend.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, UUID> {


    List<Settlement> findBySettlementDate(LocalDate settlementDate);


    List<Settlement> findByRentalArea_RentalAreaIdOrderBySettlementDateDesc(UUID rentalAreaId);

    Optional<Settlement> findByRentalArea_RentalAreaIdAndSettlementDate(
            UUID rentalAreaId,
            LocalDate settlementDate
    );

    boolean existsByRentalArea_Owner_UserIdAndStatus(
            UUID ownerId,
            SettlementStatus status
    );
}
