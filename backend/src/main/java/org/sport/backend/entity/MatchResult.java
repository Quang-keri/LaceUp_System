package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.ResultStatus;

import java.util.*;

@Entity
@Table(name = "match_results")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResult extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID resultId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    private UUID submitterId;

    @Column(name = "winning_team_number")
    private Integer winningTeamNumber;

    @ElementCollection
    @CollectionTable(
            name = "match_result_winners",
            joinColumns = @JoinColumn(name = "result_id")
    )
    @Column(name = "user_id")
    private List<UUID> winnerIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "match_result_losers",
            joinColumns = @JoinColumn(name = "result_id")
    )
    @Column(name = "user_id")
    private List<UUID> loserIds = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private ResultStatus status;

    @ElementCollection
    @CollectionTable(
            name = "match_result_absent_users",
            joinColumns = @JoinColumn(name = "result_id")
    )
    @Column(name = "user_id")
    private List<UUID> absentUserIds = new ArrayList<>();


    @ElementCollection
    @CollectionTable(
            name = "match_result_rank_changes",
            joinColumns = @JoinColumn(name = "result_id")
    )
    @MapKeyColumn(name = "user_id")
    @Column(name = "point_change")
    private Map<UUID, Integer> rankChanges = new HashMap<>();
}
