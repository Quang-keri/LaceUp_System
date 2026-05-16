package org.sport.backend.repository;

import org.sport.backend.entity.BookingServiceItem;
import org.sport.backend.entity.ServiceItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ServiceItemRepository extends JpaRepository<ServiceItem, UUID>, JpaSpecificationExecutor<ServiceItem> {
    List<ServiceItem> findByRentalArea_RentalAreaId(UUID rentalAreaRentalAreaId);

    @Query("SELECT s FROM ServiceItem s WHERE s.rentalArea.owner.email = :email " +
            "AND (:keyword IS NULL OR LOWER(s.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<ServiceItem> searchByOwnerEmailAndKeyword(
            @Param("email") String email,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT bsi FROM BookingServiceItem bsi WHERE bsi.booking.rentalArea.rentalAreaId = :rentalAreaId " +
            "AND bsi.booking.startTime >= :startOfDay AND bsi.booking.startTime <= :endOfDay")
    List<BookingServiceItem> findServiceItemsForReport(
            @Param("rentalAreaId") UUID rentalAreaId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );
}
