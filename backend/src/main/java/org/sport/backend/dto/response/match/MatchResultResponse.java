package org.sport.backend.dto.response.match;

import lombok.Builder;
import lombok.Data;
import org.sport.backend.constant.ResultStatus;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MatchResultResponse {
    private UUID resultId;
    private UUID matchId;
    private UUID submitterId;
    private List<UUID> winnerIds;
    private List<UUID> loserIds;
    private ResultStatus status;
}