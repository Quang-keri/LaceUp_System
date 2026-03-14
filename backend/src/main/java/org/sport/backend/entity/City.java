package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Table(name = "cities")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "city_id")
    Long cityId;

    @Column(name = "city_name", nullable = false, unique = true)
    String cityName;

    @OneToMany(mappedBy = "city", fetch = FetchType.LAZY)
    List<RentalArea> rentalAreas;
}
