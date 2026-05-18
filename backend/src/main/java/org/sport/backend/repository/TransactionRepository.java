package org.sport.backend.repository;

import org.sport.backend.constant.TransactionType;
import org.sport.backend.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    Page<Transaction> findByRentalArea_RentalAreaId(
            UUID rentalAreaId,
            Pageable pageable
    );

    Page<Transaction> findByRentalArea_RentalAreaIdAndType(
            UUID rentalAreaId,
            TransactionType type,
            Pageable pageable
    );

    Page<Transaction> findByOwner_UserId(
            UUID ownerId,
            Pageable pageable
    );

    Page<Transaction> findByOwner_UserIdAndType(
            UUID ownerId,
            TransactionType type,
            Pageable pageable
    );
    @Query("""
    SELECT COALESCE(SUM(t.amount), 0)
    FROM Transaction t
    WHERE t.rentalArea.rentalAreaId = :rentalAreaId
    AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
    AND t.type = org.sport.backend.constant.TransactionType.INCOME
    AND t.category IN (
        org.sport.backend.constant.TransactionCategory.BOOKING_DEPOSIT,
        org.sport.backend.constant.TransactionCategory.BOOKING_FULL_PAYMENT,
        org.sport.backend.constant.TransactionCategory.BOOKING_REMAINING_PAYMENT
    )
    AND DATE(t.booking.startTime) = :settlementDate
""")
    BigDecimal sumCommissionableBookingIncome(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("settlementDate") LocalDate settlementDate
    );
    @Query("""
    SELECT COALESCE(SUM(t.amount), 0)
    FROM Transaction t
    WHERE t.rentalArea.rentalAreaId = :rentalAreaId
    AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
    AND t.type = org.sport.backend.constant.TransactionType.INCOME
    AND t.paymentMethod <> org.sport.backend.constant.PaymentMethod.CASH
    AND t.category IN (
        org.sport.backend.constant.TransactionCategory.BOOKING_DEPOSIT,
        org.sport.backend.constant.TransactionCategory.BOOKING_FULL_PAYMENT,
        org.sport.backend.constant.TransactionCategory.BOOKING_REMAINING_PAYMENT
    )
    AND DATE(t.booking.startTime) = :settlementDate
""")
    BigDecimal sumAdminCollectedBookingIncome(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("settlementDate") LocalDate settlementDate
    );


    @Query("""
    SELECT COALESCE(SUM(t.amount), 0)
    FROM Transaction t
    WHERE t.status = 'SUCCESS'
      AND t.type = 'INCOME'
      AND t.transactionDate BETWEEN :startDate AND :endDate
      AND (
            :ownerId IS NULL
            OR t.owner.userId = :ownerId
      )
""")
    BigDecimal getTotalIncomeRevenue(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("ownerId") UUID ownerId
    );


}
