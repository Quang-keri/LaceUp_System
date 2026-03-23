package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.sport.backend.dto.response.match.MatchResultResponse;
import org.sport.backend.entity.MatchResult;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MatchResultMapper {

    @Mapping(source = "match.matchId", target = "matchId")
    MatchResultResponse toResponse(MatchResult matchResult);

    List<MatchResultResponse> toResponseList(List<MatchResult> matchResults);
}