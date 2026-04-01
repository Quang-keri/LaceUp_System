package org.sport.backend.repository;

import org.sport.backend.entity.Booking;
import org.sport.backend.entity.BookingServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingServiceItemRepository extends JpaRepository<BookingServiceItem, UUID> {

    List<BookingServiceItem> findByBooking(Booking booking);
     List<BookingServiceItem> findByBooking_BookingId(UUID bookingId);
}
