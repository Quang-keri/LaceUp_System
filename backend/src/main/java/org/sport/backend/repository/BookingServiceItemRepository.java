package org.sport.backend.repository;

import org.sport.backend.entity.Booking;
import org.sport.backend.entity.BookingServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingServiceItemRepository extends JpaRepository<BookingServiceItem, UUID> {

    List<BookingServiceItem> findByBooking(Booking booking);

    List<BookingServiceItem> findByBooking_BookingId(UUID bookingId);

    @Query("SELECT bsi FROM BookingServiceItem bsi WHERE bsi.booking.startTime >= :startOfDay AND bsi.booking.startTime <= :endOfDay")
    List<BookingServiceItem> findAllServiceItemsForReport(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    List<BookingServiceItem> findByBooking_BookingIdIn(List<UUID> bookingIds);
}
