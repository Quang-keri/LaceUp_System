package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "user_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStats {
    @Id
    private UUID userId; // Dùng chung ID với User

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Builder.Default
    private int currentWinStreak = 0;

    @Builder.Default
    private int maxWinStreak = 0;

    @Builder.Default
    private int totalWins = 0;

    @Builder.Default
    private int totalMatches = 0;
}