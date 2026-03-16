package org.sport.backend.mapper;

import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.entity.Match;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MatchMapper {

    public MatchResponse toResponse(Match match) {
        if (match == null) return null;

        return MatchResponse.builder()
                .matchId(match.getMatchId())
                .courtName(match.getCourt().getCourtName())
                .surfaceType(match.getCourt().getSurfaceType())
                .startTime(match.getStartTime())
                .endTime(match.getEndTime())
                .maxPlayers(match.getMaxPlayers())
                .currentPlayers(match.getCurrentPlayers())
                .remainingSlots(match.getMaxPlayers() - match.getCurrentPlayers())
                .status(match.getStatus().name())
                .hostName(match.getHost().getFullName()) // Giả sử User có trường này
                .isFull(match.getCurrentPlayers() >= match.getMaxPlayers())
                .build();
    }

    public List<MatchResponse> toResponseList(List<Match> matches) {
        return matches.stream().map(this::toResponse).toList();
    }
}