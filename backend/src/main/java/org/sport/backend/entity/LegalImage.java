package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;


import java.util.UUID;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class LegalImage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String imageUrl;

    private String publicId;
    @ManyToOne
    @JoinColumn(name = "legal_id")
    private LegalProfile legalProfile;

}
