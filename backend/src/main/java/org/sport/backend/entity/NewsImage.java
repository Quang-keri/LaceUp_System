package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "news_images")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsImage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID imageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "news_id", nullable = false)
    private News news;

    @Column(nullable = false)
    private String imageUrl;

    private String publicId;

    @Builder.Default
    @Column(name = "is_cover", nullable = false)
    private Boolean isCover = false;
}
