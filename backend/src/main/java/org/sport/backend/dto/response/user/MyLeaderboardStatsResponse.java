package org.sport.backend.dto.response.user;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyLeaderboardStatsResponse {

    private Integer currentRankPosition;
    private long totalUsersInCategory;
    private double topPercentage;
    private LeaderboardEntryResponse myStats;

}
