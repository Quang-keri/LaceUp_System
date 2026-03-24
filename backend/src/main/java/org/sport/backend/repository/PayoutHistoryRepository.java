package org.sport.backend.repository;

import org.sport.backend.constant.PayoutStatus;
import org.sport.backend.entity.PayoutHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayoutHistoryRepository extends JpaRepository<PayoutHistory, UUID> {


    boolean existsByRentalArea_RentalAreaIdAndSettlementMonthAndSettlementYearAndStatus(
            UUID rentalAreaId,
            int month,
            int year,
            PayoutStatus status
    );


    List<PayoutHistory> findByRentalArea_RentalAreaIdOrderByCreatedAtDesc(UUID rentalAreaId);
}
