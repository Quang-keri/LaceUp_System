package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import lombok.experimental.SuperBuilder;
import org.sport.backend.base.BaseEntity;
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
    UUID paymentId;

    @Column(name = "transaction_date", nullable = false)
    LocalDateTime transactionDate;

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type")
    private PaymentType paymentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(name = "channel")
    private String channel;

    @Column(name = "transaction_code")
    private String transactionCode;

}