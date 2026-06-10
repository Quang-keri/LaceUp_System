package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.PaymentMethod;
import org.sport.backend.constant.PaymentStatus;
import org.sport.backend.constant.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table(name = "payments")
@Entity
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type")
    private PaymentType paymentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(name = "channel")
    private String channel;

    @Column(name = "transaction_code")
    private String transactionCode;

    @Column(name = "proof")
    private String proof;

    @Column(name = "order_code", unique = true)
    private Long orderCode;

    @Column(name = "payos_payment_link_id")
    private String payosPaymentLinkId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_intent_id")
    private BookingIntent bookingIntent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id")
    private MatchRegistration matchRegistration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_participant_id")
    private BookingParticipant bookingParticipant;

    @Column(name = "refund_note", length = 1000)
    private String refundNote;

    @Column(name = "refund_processed_at")
    private LocalDateTime refundProcessedAt;
}
