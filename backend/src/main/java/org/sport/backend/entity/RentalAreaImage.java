package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "rental_area_images")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RentalAreaImage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rental_area_image_id")
    UUID rentalAreaImageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_area_id", nullable = false)
    RentalArea rentalArea;

    @Column(name = "image_url", length = 500, nullable = false)
    String imageUrl;

    @Column(name = "public_id", length = 255, nullable = false)
    String publicId;

    @Builder.Default
    @Column(name = "is_cover", nullable = false)
    Boolean isCover = false;

    @Column(name = "sort_order")
    Integer sortOrder;

}
