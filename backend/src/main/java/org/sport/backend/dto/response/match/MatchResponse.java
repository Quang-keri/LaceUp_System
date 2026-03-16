package org.sport.backend.dto.response.match;

@Data
@Builder
public class MatchResponse {
    private UUID matchId;
    private String courtName;
    private String surfaceType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxPlayers;
    private Integer currentPlayers;
    private Integer remainingSlots; // max - current
    private String status;
    private String hostName;
    private boolean isFull;
}
