package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "intent_slots")
public class IntentSlot {

    @Id
    @Column(name = "intent_slot_id")
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID intentSlotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_intent_id")
    private BookingIntent bookingIntent;

    @ManyToOne
    CourtCopy courtCopy;

    Integer quantity;

    BigDecimal price;

    LocalDateTime startTime;
    LocalDateTime endTime;
}