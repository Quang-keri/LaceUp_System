package org.sport.backend.repository;

import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.entity.BookingIntent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingIntentRepository extends JpaRepository<BookingIntent, UUID> {

    List<BookingIntent> findByStatusAndExpiresAtBefore(
            BookingIntentStatus status,
            LocalDateTime time
    );
}