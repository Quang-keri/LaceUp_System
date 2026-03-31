package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.constant.MatchType;
import org.sport.backend.constant.RecurringType;

import java.time.LocalDate;
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
    @JoinColumn(name = "court_id")
    private Court court;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id")
    private User host;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Integer maxPlayers;
    private Integer minPlayersToStart;
    private Integer currentPlayers;

    @Enumerated(EnumType.STRING)
    private MatchStatus status;

    private boolean isRecurring;
    @Enumerated(EnumType.STRING)
    private RecurringType recurringType;

    private String dayOfWeek;

    private LocalDate endDate;

    @OneToMany(mappedBy = "match", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<MatchRegistration> registrations;

    @Embedded
    private Address address;

    @Enumerated(EnumType.STRING)
    private MatchType matchType;

    private Double winnerPercent;
    private Double betAmount;

    private Integer minRank;
    private Integer maxRank;

    private String note;
}