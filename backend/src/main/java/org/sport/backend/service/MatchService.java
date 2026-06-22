package org.sport.backend.service;

import jakarta.transaction.Transactional;
import org.sport.backend.dto.base.PageResponse;
import org.sport.backend.constant.MatchStatus;
import org.sport.backend.constant.MatchType;
import org.sport.backend.dto.request.chat.DivideTeamRequest;
import org.sport.backend.dto.request.match.AutoMatchRequest;
import org.sport.backend.dto.request.match.MatchRequest;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.dto.response.payment.CheckoutResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public interface MatchService {

    MatchResponse createMatch(MatchRequest request);

    @Transactional
    CheckoutResponse joinMatch(UUID matchId, Integer playerCount);

    @Transactional
    void joinByRoomCode(String roomCode, Integer playerCount);

    @Transactional
    MatchResponse autoMatch(AutoMatchRequest request);

    @Transactional
    void divideTeams(UUID matchId, DivideTeamRequest request);

    PageResponse<MatchResponse> getOpenMatches(
            int page,
            int size,
            String category,
            String keyword,
            LocalDateTime startDate,
            LocalDateTime endDate,
            MatchType matchType,
            String ward, String city);

    MatchResponse getMatchDetail(UUID matchId);

    PageResponse<MatchResponse> getAllMatches(
            int page, int size, MatchStatus status, String category, String keyword,
            LocalDateTime start, LocalDateTime end, MatchType matchType);

    PageResponse<MatchResponse> getOwnerMatchesPaged(
            int page, int size, MatchStatus status, String category,
            String keyword, LocalDateTime startDate, LocalDateTime endDate);

    PageResponse<MatchResponse> getMyMatches(int page, int size);

    PageResponse<MatchResponse> getUserMatchHistory(UUID userId, int page, int size);

    @Transactional
    void generateNextMatches();

    @Transactional
    void leaveMatch(UUID matchId);
}
