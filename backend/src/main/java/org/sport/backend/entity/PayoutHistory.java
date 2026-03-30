package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.PayoutStatus;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "payout_histories")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class PayoutHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payout_id")
    private UUID payoutId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_area_id", nullable = false)
    private RentalArea rentalArea;

    @Column(name = "settlement_month", nullable = false)
    private Integer settlementMonth;

    @Column(name = "settlement_year", nullable = false)
    private Integer settlementYear;

    @Column(name = "total_revenue", precision = 19, scale = 2)
    private BigDecimal totalRevenue;

    @Column(name = "commission_amount", precision = 19, scale = 2)
    private BigDecimal commissionAmount;

    @Column(name = "payout_amount", precision = 19, scale = 2)
    private BigDecimal payoutAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private PayoutStatus status;

    @Column(name = "transaction_reference")
    private String transactionReference;

    @Column(name = "note", length = 500)
    private String note;
}