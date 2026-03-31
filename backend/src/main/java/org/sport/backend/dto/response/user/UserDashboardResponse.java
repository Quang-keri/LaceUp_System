package org.sport.backend.dto.response.user;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDashboardResponse {
    private UUID userId;
    private String userName;
    private String avatarUrl;

    private int totalMatches;
    private int totalWins;
    private double winRate;

    private List<CategoryRankResponse> categoryRanks;
}