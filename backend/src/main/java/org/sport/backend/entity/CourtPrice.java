package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.sport.backend.constant.PriceType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "court_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourtPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JoinColumn(name = "court_price_id")
    private UUID courtPriceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id")
    private Court court;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "price_per_hour")
    private BigDecimal pricePerHour;

    @Column(name = "specific_date")
    private LocalDate specificDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_type")
    private PriceType priceType;

    @Column(name = "priority")
    private Integer priority;
}
