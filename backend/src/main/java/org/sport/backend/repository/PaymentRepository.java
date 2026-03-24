package org.sport.backend.repository;

import org.sport.backend.entity.Booking;
import org.sport.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    @Query("SELECT SUM(p.amount) FROM Payment p " +
            "WHERE p.paymentStatus = 'COMPLETED' " +
            "AND p.transactionDate BETWEEN :startDate AND :endDate " +
            "AND (:ownerId IS NULL OR p.user.userId = :ownerId)")
    BigDecimal getTotalRevenue(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("ownerId") UUID ownerId
    );

    @Query("SELECT p.paymentStatus, COUNT(p) FROM Payment p " +
            "WHERE p.transactionDate BETWEEN :startDate AND :endDate " +
            "AND (:ownerId IS NULL OR p.user.userId = :ownerId) " +
            "GROUP BY p.paymentStatus")
    List<Object[]> countByPaymentStatus(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("ownerId") UUID ownerId
    );

    Optional<Payment> findFirstByBookingOrderByTransactionDateDesc(Booking booking);
    Optional<Payment> findByPayosOrderCode(Long payosOrderCode);

    @Query("SELECT DISTINCT b.rentalArea.rentalAreaId FROM Payment p " +
            "JOIN p.booking b " +
            "WHERE p.paymentStatus = 'SUCCESS' " + // Giả sử Enum của bạn có giá trị SUCCESS
            "AND p.transactionDate >= :startDate AND p.transactionDate <= :endDate")
    List<UUID> findRentalAreasWithSuccessfulPayments(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Tính tổng tiền Admin đã thực thu (SUCCESS) của một Tòa nhà trong tháng
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "JOIN p.booking b " +
            "WHERE b.rentalArea.rentalAreaId = :rentalAreaId " +
            "AND p.paymentStatus = 'SUCCESS' " +
            "AND p.transactionDate >= :startDate AND p.transactionDate <= :endDate")
    BigDecimal sumRevenueByRentalAreaAndDate(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Đếm số lượng booking đã được thanh toán của một Tòa nhà trong tháng
    @Query("SELECT COUNT(DISTINCT b.bookingId) FROM Payment p " +
            "JOIN p.booking b " +
            "WHERE b.rentalArea.rentalAreaId = :rentalAreaId " +
            "AND p.paymentStatus = 'SUCCESS' " +
            "AND p.transactionDate >= :startDate AND p.transactionDate <= :endDate")
    Long countBookingsByRentalAreaAndDate(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

}