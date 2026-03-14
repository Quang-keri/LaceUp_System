package org.sport.backend.repository;

import org.sport.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID>, JpaSpecificationExecutor<Booking> {

    @Query("SELECT b.bookingStatus, COUNT(b) FROM Booking b GROUP BY b.bookingStatus")
    List<Object[]> countAllByStatus();
}
