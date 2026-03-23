package org.sport.backend.dto.response.match;

import lombok.Builder;
import lombok.Data;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.constant.MatchType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MatchResponse {
    private UUID matchId;
    private String courtName;
    private String courtPrice;
    private String address;
    private String categoryName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxPlayers;
    private Integer currentPlayers;
    private Integer remainingSlots;
    private String status;
    private String hostName;
    private boolean isFull;
    private boolean hasCourt;
    private List<UserResponse> participants;

    private MatchType matchType;
    private Double winnerPercent;
    private Integer minRank;
    private Integer maxRank;
}