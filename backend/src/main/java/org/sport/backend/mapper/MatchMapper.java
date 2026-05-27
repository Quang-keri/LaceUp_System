package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import org.sport.backend.dto.response.match.MatchReportResponse;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.entity.CourtPrice;
import org.sport.backend.entity.Match;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface MatchMapper {

    UserMapper userMapper = Mappers.getMapper(UserMapper.class);

    default MatchResponse toResponse(Match match) {
        if (match == null) return null;

        return MatchResponse.builder()
                .matchId(match.getMatchId())
                .roomCode(match.getRoomCode())
                .courtName(match.getCourt() != null ? match.getCourt().getCourtName() : "Sân tự thỏa thuận")
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
                .courtPrice(findCourtPriceForMatch(match))

                .matchType(match.getMatchType())
                .minRank(match.getMinRank())
                .maxRank(match.getMaxRank())
                .note(match.getNote())

                .reports(match.getReports() == null ? Collections.emptyList() :
                        match.getReports().stream()
                                .map(report -> MatchReportResponse.builder()
                                        .reportId(report.getReportId())
                                        .reporterName(report.getReporter() != null ? report.getReporter().getUserName() : "Người chơi")
                                        .reasonType(report.getReasonType())
                                        .description(report.getDescription())
                                        .status(report.getStatus())
                                        .build())
                                .collect(Collectors.toList()))

                .participants(match.getRegistrations() == null ? Collections.emptyList() :
                        match.getRegistrations().stream()
                                .map(reg -> {
                                    var userRes = userMapper.toUserResponse(reg.getUser());

                                    userRes.setTeamNumber(reg.getTeamNumber());

                                    return userRes;
                                })
                                .collect(Collectors.toList()))
                .build();
    }

    default List<MatchResponse> toResponseList(List<Match> matches) {
        if (matches == null) return Collections.emptyList();
        return matches.stream().map(this::toResponse).toList();
    }

    default String findCourtPriceForMatch(Match match) {

        if (match.getCourt() == null) {
            return "Chưa cập nhật";
        }

        if (match.getCourt().getCourtPrices() == null) {
            return "Chưa cập nhật";
        }
        if (match.getCourt().getCourtPrices().isEmpty()) {
            return "Chưa cập nhật";
        }

        LocalDateTime matchStart = match.getStartTime();
        if (matchStart == null) {
            return "Chưa cập nhật";
        }

        LocalTime time = matchStart.toLocalTime();

        for (CourtPrice cp : match.getCourt().getCourtPrices()) {
            System.out.printf("   + ID: %s | Start: %s | End: %s | Price: %s | Priority: %s%n",
                    cp.getCourtPriceId(), cp.getStartTime(), cp.getEndTime(), cp.getPricePerHour(), cp.getPriority());
        }

        Optional<CourtPrice> bestPrice = match.getCourt().getCourtPrices().stream()
                .filter(cp -> cp.getStartTime() != null && cp.getEndTime() != null)
                .filter(cp -> {
                    boolean isAfterOrEqualStart = !time.isBefore(cp.getStartTime());
                    boolean isBeforeEnd = !time.isAfter(cp.getEndTime());
                    boolean isMatch = isAfterOrEqualStart && isBeforeEnd;

                    if (isMatch) {
                        System.out.println("   => [TÌM THẤY] Khung giờ khớp: Start=" + cp.getStartTime() + ", End=" + cp.getEndTime());
                    }
                    return isMatch;
                })
                .max(Comparator.comparing(CourtPrice::getPriority, Comparator.nullsFirst(Integer::compareTo)));

        if (bestPrice.isPresent()) {
            return bestPrice.get().getPricePerHour().toString();
        } else {
            return "Chưa cập nhật";
        }
    }
}