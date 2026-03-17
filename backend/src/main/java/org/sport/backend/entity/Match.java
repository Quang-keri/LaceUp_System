package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.base.BaseEntity;
import org.sport.backend.constant.MatchStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "matches")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Match extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID matchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id", nullable = true)
    private Court court;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id")
    private User host;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Integer maxPlayers; // Ví dụ: 6 người
    private Integer minPlayersToStart; // Ví dụ: >= 5 người thì đá
    private Integer currentPlayers; // Số người đã join thực tế

    @Enumerated(EnumType.STRING)
    private MatchStatus status;

    private boolean isRecurring; // Có tự động lặp lại không
    private String recurringType; // WEEKLY, MONTHLY

    @OneToMany(mappedBy = "match", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<MatchRegistration> registrations;

    private String address;
}