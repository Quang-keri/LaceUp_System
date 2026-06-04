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
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

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

    @Query("""
                SELECT COALESCE(SUM(t.amount), 0)
                FROM Transaction t
                WHERE t.rentalArea.rentalAreaId = :rentalAreaId
                  AND DATE(t.booking.startTime) = :settlementDate
                  AND t.booking.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
                  AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
                  AND t.type = org.sport.backend.constant.TransactionType.INCOME
                  AND t.paymentMethod IN (
                      org.sport.backend.constant.PaymentMethod.VN_PAY,
                      org.sport.backend.constant.PaymentMethod.PAY_OS
                  )
            """)
    BigDecimal sumAdminCollectedForCompletedBookings(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("settlementDate") LocalDate settlementDate
    );

    @Query("""
                SELECT COALESCE(SUM(t.amount), 0)
                FROM Transaction t
                WHERE t.rentalArea.rentalAreaId = :rentalAreaId
                  AND t.booking.startTime >= :startDate AND t.booking.startTime < :endDate
                  AND t.booking.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
                  AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
                  AND t.type = org.sport.backend.constant.TransactionType.INCOME
                  AND t.paymentMethod IN (
                      org.sport.backend.constant.PaymentMethod.VN_PAY,
                      org.sport.backend.constant.PaymentMethod.PAY_OS
                  )
            """)
    BigDecimal sumAdminCollectedForCompletedBookingsMonthly(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("""
                SELECT COALESCE(SUM(b.depositAmount), 0)
                FROM Booking b
                WHERE b.rentalArea.rentalAreaId = :rentalAreaId
                AND DATE(b.startTime) = :date
                AND b.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
            """)
    BigDecimal sumInitialPaidAmountOfCompletedBookings(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("date") LocalDate date
    );

    @Query("""
                SELECT COALESCE(SUM(b.totalPrice), 0) - COALESCE(SUM(s.price), 0)
                FROM Booking b
                JOIN b.slots s
                WHERE b.rentalArea.rentalAreaId = :rentalAreaId
                AND DATE(b.startTime) = :date
                AND b.bookingStatus = org.sport.backend.constant.BookingStatus.COMPLETED
            """)
    BigDecimal sumExtraServiceAmountOfCompletedBookings(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("date") LocalDate date
    );

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        WHERE t.rentalArea.rentalAreaId = :rentalAreaId
          AND t.type = org.sport.backend.constant.TransactionType.INCOME
          AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
          AND DATE(t.transactionDate) >= :startDate
          AND DATE(t.transactionDate) <= :endDate
    """)
    BigDecimal sumTotalIncomeByRentalArea(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        WHERE t.rentalArea.rentalAreaId = :rentalAreaId
          AND t.type = org.sport.backend.constant.TransactionType.EXPENSE
          AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
          AND DATE(t.transactionDate) >= :startDate
          AND DATE(t.transactionDate) <= :endDate
    """)
    BigDecimal sumTotalExpenseByRentalArea(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        WHERE t.rentalArea.rentalAreaId = :rentalAreaId
          AND t.category = org.sport.backend.constant.TransactionCategory.OWNER_PAYOUT
          AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
          AND DATE(t.transactionDate) >= :startDate
          AND DATE(t.transactionDate) <= :endDate
    """)
    BigDecimal sumSystemTransferredByRentalArea(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // =========================================================================
    // QUERIES CHO TỔNG QUAN GIAO DỊCH (SUMMARY) THEO TÀI KHOẢN CHỦ SÂN (OWNER)
    // =========================================================================

    @Query("""
                SELECT COALESCE(SUM(t.amount), 0)
                FROM Transaction t
                WHERE t.owner.userId = :ownerId
                  AND t.type = org.sport.backend.constant.TransactionType.INCOME
                  AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
                  AND (:startDate IS NULL OR DATE(t.transactionDate) >= :startDate)
                  AND (:endDate IS NULL OR DATE(t.transactionDate) <= :endDate)
            """)
    BigDecimal sumTotalIncomeByOwner(
            @Param("ownerId") UUID ownerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
                SELECT COALESCE(SUM(t.amount), 0)
                FROM Transaction t
                WHERE t.owner.userId = :ownerId
                  AND t.type = org.sport.backend.constant.TransactionType.EXPENSE
                  AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
                  AND (:startDate IS NULL OR DATE(t.transactionDate) >= :startDate)
                  AND (:endDate IS NULL OR DATE(t.transactionDate) <= :endDate)
            """)
    BigDecimal sumTotalExpenseByOwner(
            @Param("ownerId") UUID ownerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
                SELECT COALESCE(SUM(t.amount), 0)
                FROM Transaction t
                WHERE t.owner.userId = :ownerId
                  AND t.category = org.sport.backend.constant.TransactionCategory.OWNER_PAYOUT
                  AND t.status = org.sport.backend.constant.TransactionStatus.SUCCESS
                  AND (:startDate IS NULL OR DATE(t.transactionDate) >= :startDate)
                  AND (:endDate IS NULL OR DATE(t.transactionDate) <= :endDate)
            """)
    BigDecimal sumSystemTransferredByOwner(
            @Param("ownerId") UUID ownerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    Optional<Transaction> findByReferenceId(String referenceId);

}
