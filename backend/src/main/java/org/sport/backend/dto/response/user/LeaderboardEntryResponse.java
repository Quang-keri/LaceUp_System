package org.sport.backend.dto.response.user;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryResponse {

    private UUID userId;
    private String userName;
    private String avatar;
    private Integer rankPoint;
    private String displayRank;
    private double winRate;
    private int currentWinStreak;
    private int totalMatches;

}
