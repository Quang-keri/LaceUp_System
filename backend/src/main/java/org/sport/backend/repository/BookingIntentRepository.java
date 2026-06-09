package org.sport.backend.repository;

import org.sport.backend.constant.BookingIntentStatus;
import org.sport.backend.entity.BookingIntent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingIntentRepository extends JpaRepository<BookingIntent, UUID>, JpaSpecificationExecutor<BookingIntent> {

    Page<BookingIntent> findByRentalArea_RentalAreaIdAndStatus(
            UUID rentalAreaId,
            BookingIntentStatus status,
            Pageable pageable
    );

    List<BookingIntent> findByBookerPhone(String bookerPhone);

    boolean existsByUser_UserIdAndStatusIn(
            UUID userId,
            Collection<BookingIntentStatus> statuses
    );

    List<BookingIntent> findAllByUser_UserId(UUID userId);

    void deleteAllByUser_UserId(UUID userId);
    @Modifying(
            flushAutomatically = true
    )
    @Query("""
        UPDATE BookingIntent bi
        SET bi.status = :expiredStatus
        WHERE bi.user.userId = :userId
          AND bi.status = :activeStatus
          AND bi.expiresAt IS NOT NULL
          AND bi.expiresAt <= :now
    """)
    int expireActiveIntentsByUserId(
            @Param("userId") UUID userId,
            @Param("activeStatus")
            BookingIntentStatus activeStatus,
            @Param("expiredStatus")
            BookingIntentStatus expiredStatus,
            @Param("now") LocalDateTime now
    );
}
