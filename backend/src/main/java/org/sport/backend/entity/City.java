package org.sport.backend.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@Table(name = "cities")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "city_id")
    Long cityId;

    @Column(name = "city_name", nullable = false, unique = true)
    String cityName;

    @Column(name = "province_code", unique = true)
    Integer provinceCode;

    @JsonManagedReference
    @OneToMany(mappedBy = "city", fetch = FetchType.LAZY)
    List<Ward> wards;
}
