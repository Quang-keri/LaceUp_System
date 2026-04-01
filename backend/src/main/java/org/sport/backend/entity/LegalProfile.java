package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


@Entity
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "legal_profiles")
public class LegalProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String businessLicenseNumber;
    private String taxId;
    private String legalNote;
    @ManyToOne
    @JoinColumn(name = "rental_area_id")
    private RentalArea rentalArea;
    @OneToMany(mappedBy = "legalProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LegalImage> images = new ArrayList<>();
}