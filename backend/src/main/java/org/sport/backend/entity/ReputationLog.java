package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "reputation_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ReputationLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "points_changed", nullable = false)
    private Integer pointsChanged;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
}