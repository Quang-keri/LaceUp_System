package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.ResultStatus;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    private List<UUID> winnerIds;

    @ElementCollection
    private List<UUID> loserIds;

    @Enumerated(EnumType.STRING)
    private ResultStatus status;

    @ElementCollection
    private List<UUID> absentUserIds;

    @ElementCollection
    @CollectionTable(name = "match_result_rank_changes", joinColumns = @JoinColumn(name = "result_id"))
    @MapKeyColumn(name = "user_id")
    @Column(name = "point_change")
    private Map<UUID, Integer> rankChanges = new HashMap<>();
}
