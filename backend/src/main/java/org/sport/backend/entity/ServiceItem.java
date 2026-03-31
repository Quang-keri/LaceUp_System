package org.sport.backend.entity;



import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "service_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "service_item_id")
    private UUID serviceItemId;

    @ManyToOne
    @JoinColumn(name = "rental_area_id")
    private RentalArea rentalArea;

    @ManyToOne
    @JoinColumn(name = "item_group_id")
    private ItemGroup itemGroup;

    private String serviceName;

    private Integer quantity;

    private String rentalDuration;

    @Column(precision = 12, scale = 2)
    private BigDecimal priceSell;

    @Column(precision = 12, scale = 2)
    private BigDecimal priceOriginal;

    private String serviceNote;

    @OneToMany(mappedBy = "serviceItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceItemImage> images;
}
