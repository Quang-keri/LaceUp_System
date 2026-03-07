package org.sport.backend.repository;

import org.rent.room.be.entity.BookingIntent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BookingIntentRepository extends JpaRepository<BookingIntent, UUID> {
}
