package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.entity.Match;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface MatchMapper {

    UserMapper userMapper = Mappers.getMapper(UserMapper.class);

    default MatchResponse toResponse(Match match) {
        if (match == null) return null;

        return MatchResponse.builder()
                .matchId(match.getMatchId())
                .courtName(match.getCourt() != null ? match.getCourt().getCourtName() : "Sân tự thỏa thuận")
//                .courtPrice(String.valueOf(match.getCourt() != null ? match.getCourt().getPrice() : null))
                .address(match.getCourt() != null ? match.getCourt().getRentalArea().getAddress() : match.getAddress())
                .categoryName(match.getCategory() != null ? match.getCategory().getCategoryName() : "Chưa xác định")
                .startTime(match.getStartTime())
                .endTime(match.getEndTime())
                .maxPlayers(match.getMaxPlayers())
                .currentPlayers(match.getCurrentPlayers())
                .remainingSlots(match.getMaxPlayers() - match.getCurrentPlayers())
                .status(match.getStatus().name())
                .hostName(match.getHost().getUserName())
                .isFull(match.getCurrentPlayers() >= match.getMaxPlayers())
                .hasCourt(match.getCourt() != null)

                .matchType(match.getMatchType())
                .winnerPercent(match.getWinnerPercent())
                .minRank(match.getMinRank())
                .maxRank(match.getMaxRank())

                .participants(match.getRegistrations() == null ? Collections.emptyList() :
                        match.getRegistrations().stream()
                                .map(reg -> userMapper.toUserResponse(reg.getUser()))
                                .collect(Collectors.toList()))
                .build();
    }

    default List<MatchResponse> toResponseList(List<Match> matches) {
        if (matches == null) return Collections.emptyList();
        return matches.stream().map(this::toResponse).toList();
    }
}