package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.ResultStatus;

import java.util.List;
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

    @ManyToOne
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
    private ResultStatus status; // PENDING, APPROVED, REJECTED
}