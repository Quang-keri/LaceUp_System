package org.sport.backend.dto.request.match;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MatchRequest {
    private UUID courtId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxPlayers;
    private Integer minPlayersToStart;
    private boolean isRecurring;
}
