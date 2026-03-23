package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.base.BaseEntity;
import org.sport.backend.constant.CourtStatus;

import java.math.BigDecimal;
import java.util.*;

@Entity
@Table(name = "courts")
@SuperBuilder
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Court extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "court_id")
    private UUID courtId;

    @Column(name = "court_name", length = 150, nullable = false)
    private String courtName;

    @Column(name = "surface_type")
    private String surfaceType;

//    @Column(name = "price")
//    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "court_status")
    private CourtStatus courtStatus;

    @Column(name = "indoor")
    private boolean indoor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_area_id", nullable = false)
    private RentalArea rentalArea;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "court_amenities",
            joinColumns = @JoinColumn(name = "court_id"),
            inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    private Set<Amenity> amenities = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "court", fetch = FetchType.LAZY)
    private List<CourtCopy> courtCopies;

    @OneToMany(mappedBy = "court", fetch = FetchType.LAZY)
    private List<CourtPrice> courtPrices;

    @Builder.Default
    @OneToMany(mappedBy = "court", fetch = FetchType.LAZY,
            cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CourtImage> images = new ArrayList<>();

}
