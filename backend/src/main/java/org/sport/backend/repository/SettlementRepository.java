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
    boolean existsByRentalArea_RentalAreaIdAndSettlementDate(
            UUID rentalAreaId,
            LocalDate settlementDate
    );
    @Query("""
    SELECT COALESCE(SUM(s.commissionAmount), 0)
    FROM Settlement s
    WHERE s.settlementDate = :date
""")
    BigDecimal sumAdminCommissionByDate(LocalDate date);

    @Query("""
    SELECT COALESCE(SUM(s.ownerAmount), 0)
    FROM Settlement s
    WHERE s.settlementDate = :date
    AND s.status = :status
""")
    BigDecimal sumOwnerAmountByDateAndStatus(LocalDate date, SettlementStatus status);
    List<Settlement> findBySettlementDate(LocalDate settlementDate);

    List<Settlement> findByStatus(SettlementStatus status);

    List<Settlement> findByRentalArea_RentalAreaIdOrderBySettlementDateDesc(UUID rentalAreaId);

    Optional<Settlement> findByRentalArea_RentalAreaIdAndSettlementDate(
            UUID rentalAreaId,
            LocalDate settlementDate
    );
}
