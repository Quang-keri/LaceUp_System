package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;

import java.math.BigDecimal;
import java.util.UUID;


@SuperBuilder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "commission_configs")
public class CommissionConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID commissionConfigId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_area_id")
    private RentalArea rentalArea;

    @Column(name = "min_bookings")
    private Integer minBookings;

    @Column(name = "max_bookings")
    private Integer maxBookings;

    @Column(name = "commission_rate", precision = 5, scale = 4)
    private BigDecimal rate;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "note")
    private String note;
}
