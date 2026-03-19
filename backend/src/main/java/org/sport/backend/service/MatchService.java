package org.sport.backend.service;

import org.sport.backend.base.PageResponse;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.dto.request.match.MatchRequest;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface MatchService {

    MatchResponse createMatch(MatchRequest request);

    void joinMatch(UUID matchId);

    List<MatchResponse> getOpenMatches();

    MatchResponse getMatchDetail(UUID matchId);

    PageResponse<MatchResponse> getAllMatches(
            int page, int size, MatchStatus status, String category,
            String keyword, LocalDateTime start, LocalDateTime end);

    PageResponse<MatchResponse> getOwnerMatchesPaged(int page, int size);
}
