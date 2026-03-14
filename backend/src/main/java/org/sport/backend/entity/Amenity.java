package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.sport.backend.base.BaseEntity;
import org.springframework.data.domain.Auditable;

import java.util.Set;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Table(name = "amenity")
public class Amenity  extends BaseEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "amenity_id")
    private Long amenityId;

    @Column(name = "amenity_name", length = 100, nullable = false, unique = true)
    private String amenityName;

    @Column(name = "icon_key", length = 50, nullable = false)
    private String iconKey;

    @ManyToMany(mappedBy = "amenities", fetch = FetchType.LAZY)
    private Set<Court> courts;
}
