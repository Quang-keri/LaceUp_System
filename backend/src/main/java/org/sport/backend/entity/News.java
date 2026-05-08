package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.constant.NewsVisibility;
import org.sport.backend.dto.base.BaseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "news")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class News extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID newsId;


    @Column(name = "title",length = 200,nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT" ,nullable = false)
    private String content;

    private String imageUrl;

    private String sourceUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User createdBy;
    @Enumerated(EnumType.STRING)
    private NewsVisibility visibility = NewsVisibility.PUBLIC;
    @Builder.Default
    @OneToMany(mappedBy = "news", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NewsImage> images = new ArrayList<>();

}