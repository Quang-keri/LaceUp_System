package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.sport.backend.constant.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "booking_participants")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BookingParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID participantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount_paid", precision = 19, scale = 2)
    private BigDecimal amountPaid;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus;

    @Column(name = "is_host")
    private Boolean isHost;

    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "payment_proof_url", length = 1000)
    private String paymentProofUrl;

    @Column(name = "payment_proof_public_id", length = 500)
    private String paymentProofPublicId;

    @Column(name = "payment_proof_uploaded_at")
    private LocalDateTime paymentProofUploadedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
