package org.sport.backend.repository;

import org.sport.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        WHERE t.rentalArea.rentalAreaId = :rentalAreaId
        AND t.status = 'SUCCESS'
        AND t.type = 'INCOME'
        AND t.category IN ('BOOKING_DEPOSIT', 'BOOKING_FULL_PAYMENT')
        AND t.transactionDate >= :start
        AND t.transactionDate < :end
    """)
    BigDecimal sumBookingIncomeByRentalArea(
            UUID rentalAreaId,
            LocalDateTime start,
            LocalDateTime end
    );


}
