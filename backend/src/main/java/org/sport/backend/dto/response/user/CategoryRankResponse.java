package org.sport.backend.dto.response.user;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRankResponse {
    private Integer categoryId;
    private String categoryName;
    private int rankPoint;
    private String displayRank;

    private int totalMatches;
    private int totalWins;
    private int currentWinStreak;
    private double winRate;
}