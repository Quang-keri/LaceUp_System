package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.sport.backend.base.BaseEntity;
import org.sport.backend.constant.RentalAreaStatus;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "rental_areas")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RentalArea extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rental_area_id")
    UUID rentalAreaId;

    @Column(name = "rental_area_name", length = 150)
    String rentalAreaName;

    @Column(name = "address")
    String address;

    @Column(name = "contact_name", length = 100)
    String contactName;

    @Column(name = "contact_phone", length = 20)
    String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    RentalAreaStatus status;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;

    private Double rating;

    private Double latitude;

    private Double longitude;

    private LocalTime openTime;

    private LocalTime closeTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    City city;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    User owner;

    @OneToMany(mappedBy = "rentalArea",fetch = FetchType.LAZY)
    List<Court> courts;

    @OneToMany(mappedBy = "rentalArea",fetch = FetchType.LAZY)
    List<Booking> bookings;


}
