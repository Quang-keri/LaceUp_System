package org.sport.backend.service;

public interface MatchService {
    Match createMatch(MatchRequest request, User host);
    void joinMatch(UUID matchId, User user);
    List<Match> getOpenMatches();
    Match getMatchDetail(UUID matchId);
}
