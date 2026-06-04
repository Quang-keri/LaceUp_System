package org.sport.backend.dto.response.match;

import lombok.Builder;
import lombok.Data;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.constant.MatchType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MatchResponse {
    private UUID matchId;
    private String roomCode;
    private String courtName;
    private String courtPrice;
    private String categoryName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxPlayers;
    private Integer currentPlayers;
    private Integer remainingSlots;
    private String status;
    private UserResponse host;
    private boolean isFull;
    private boolean hasCourt;
    private List<UserResponse> participants;
    private MatchType matchType;
    private String note;
    private Integer minRank;
    private Integer maxRank;
    private List<MatchReportResponse> reports;
    private Boolean isPaid;
    private BigDecimal amountDue;
}