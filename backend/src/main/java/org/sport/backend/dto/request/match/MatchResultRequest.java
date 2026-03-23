package org.sport.backend.dto.request.match;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class MatchResultRequest {
    private UUID matchId;
    private List<UUID> winnerIds;
    private List<UUID> loserIds;
}