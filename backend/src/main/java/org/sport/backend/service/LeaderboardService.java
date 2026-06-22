package org.sport.backend.service;

import org.sport.backend.dto.response.user.LeaderboardEntryResponse;
import org.sport.backend.dto.response.user.MyLeaderboardStatsResponse;

import java.util.List;

public interface LeaderboardService {

    List<LeaderboardEntryResponse> getTop100ByCategory(Integer categoryId);

    MyLeaderboardStatsResponse getMyLeaderboardStats(Integer categoryId);

}
