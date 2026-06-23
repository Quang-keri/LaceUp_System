package org.sport.backend.dto.response.match;

import lombok.Builder;
import lombok.Data;
import org.sport.backend.constant.ResultStatus;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class MatchResultResponse {
    private UUID resultId;
    private UUID matchId;
    private UUID submitterId;
    private Integer winningTeamNumber;
    private List<UUID> winnerIds;
    private List<UUID> loserIds;
    private ResultStatus status;
    private List<UUID> absentUserIds;
    private Map<UUID, Integer> rankChanges;
    private String message;
}