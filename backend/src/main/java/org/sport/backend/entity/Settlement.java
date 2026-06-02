package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.sport.backend.constant.SettlementStatus;
import org.sport.backend.dto.base.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "settlements",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"rental_area_id", "settlement_date"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Settlement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID settlementId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_area_id", nullable = false)
    private RentalArea rentalArea;

    @Column(name = "settlement_date", nullable = false)
    private LocalDate settlementDate;

    @Column(name = "gross_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal commissionRate;

    @Column(name = "commission_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal commissionAmount;

    @Column(name = "owner_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal ownerAmount;

    @Column(name = "booking_revenue", nullable = false, precision = 18, scale = 2)
    private BigDecimal bookingRevenue;

    @Column(name = "initial_paid_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal initialPaidAmount;

    @Column(name = "extra_service_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal extraServiceAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SettlementStatus status;

    private String note;

    @Column(name = "transfer_code")
    private String transferCode;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by_admin_id")
    private User paidBy;
}
