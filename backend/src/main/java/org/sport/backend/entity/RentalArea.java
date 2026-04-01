package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.sport.backend.constant.VerificationStatus;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.RentalAreaStatus;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "rental_areas")

public class RentalArea extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rental_area_id")
    private UUID rentalAreaId;

    @Column(name = "rental_area_name", length = 150)
    private String rentalAreaName;

    @Embedded
    private  Address address;

    @Column(name = "contact_name", length = 100)
    private String contactName;

    @Column(name = "contact_phone", length = 20)
    private  String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private RentalAreaStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 30)
    private VerificationStatus verificationStatus;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    private Double rating;

    private Double latitude;

    private Double longitude;

    private LocalTime openTime;

    private LocalTime closeTime;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private  User owner;

    @OneToMany(mappedBy = "rentalArea", fetch = FetchType.LAZY)
    private List<Court> courts;

    @OneToMany(mappedBy = "rentalArea", fetch = FetchType.LAZY)
    private List<Booking> bookings;



    @Column(name = "facebook_link", length = 255)
    private String facebookLink;

    @Column(name = "gmail", length = 255)
    private String gmail;

    @Column(name = "reason")
    private String reason;

    @OneToMany(mappedBy = "rentalArea", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RentalAreaImage> images = new ArrayList<>();

}
