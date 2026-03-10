package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.sport.backend.constant.PostStatus;

import java.util.UUID;

@Entity
@Table(name = "posts")
@Builder
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Post {
    @Id
    @GeneratedValue(strategy =  GenerationType.UUID)
    private UUID postId;

    private String title;

    private String description;
    @Enumerated(EnumType.STRING)
    @Column(name = "post_status", length = 20)
    PostStatus postStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id", nullable = false)
    Court court;

    @OneToOne
    @JoinColumn(name = "area_id", nullable = false)
    private RentalArea rentalArea;

}
