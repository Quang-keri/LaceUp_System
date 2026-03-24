package org.sport.backend.dto.response.user;

import lombok.*;

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
    private int rankPoint;
    private String displayRank;

    // Chỉ số từ bảng UserStats
    private int totalMatches;
    private int totalWins;
    private int currentWinStreak;
    private int maxWinStreak;
    private double winRate; // Tỉ lệ thắng (%)
}