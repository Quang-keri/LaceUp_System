package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "court_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourtImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID courtImageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id", nullable = false)
    private Court court;

    @Column(nullable = false)
    private String imageUrl;


    @Column(nullable = false)
    private String publicId;


    @Builder.Default
    @Column(name = "is_cover", nullable = false)
    Boolean isCover = false;


    private Integer sortOrder;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}