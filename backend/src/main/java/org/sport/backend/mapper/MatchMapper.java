package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import org.sport.backend.dto.response.address.AddressResponse;
import org.sport.backend.dto.response.bank.BankAccountResponse;
import org.sport.backend.dto.response.city.CityResponse;
import org.sport.backend.dto.response.match.MatchReportResponse;
import org.sport.backend.dto.response.match.MatchResponse;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.entity.Address;
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

        UserResponse hostResponse = null;
        if (match.getHost() != null) {
            hostResponse = userMapper.toUserResponse(match.getHost());

            if (match.getHost().getBankAccount() != null) {
                var bank = match.getHost().getBankAccount();
                hostResponse.setBankAccount(BankAccountResponse.builder()
                        .bankAccountId(bank.getBankAccountId())
                        .bankName(bank.getBankName())
                        .accountNumber(bank.getAccountNumber())
                        .accountHolderName(bank.getAccountHolderName())
                        .branchName(bank.getBranchName())
                        .qrCode(bank.getQrCode())
                        .build());
            }
        }

        return MatchResponse.builder()
                .matchId(match.getMatchId())
                .roomCode(match.getRoomCode())
                .courtName(match.getCourt() != null ? match.getCourt().getCourtName() : "Sân tự thỏa thuận")
                .address(
                        match.getCourt() != null
                                && match.getCourt().getRentalArea() != null
                                && match.getCourt().getRentalArea().getAddress() != null
                                ? toAddressResponse(match.getCourt().getRentalArea().getAddress())
                                : null
                )
                .categoryName(match.getCategory() != null ? match.getCategory().getCategoryName() : "Chưa xác định")
                .startTime(match.getStartTime())
                .endTime(match.getEndTime())
                .maxPlayers(match.getMaxPlayers())
                .currentPlayers(match.getCurrentPlayers())
                .remainingSlots(match.getMaxPlayers() - match.getCurrentPlayers())
                .status(match.getStatus().name())
                .isFull(match.getCurrentPlayers() >= match.getMaxPlayers())
                .hasCourt(match.getCourt() != null)
                .courtPrice(findCourtPriceForMatch(match))

                .matchType(match.getMatchType())
                .minRank(match.getMinRank())
                .maxRank(match.getMaxRank())
                .note(match.getNote())

                .host(hostResponse)

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

                                    userRes.setRegistrationId(reg.getRegistrationId());
                                    userRes.setTeamNumber(reg.getTeamNumber());
                                    userRes.setAmountDue(reg.getAmountDue());
                                    userRes.setIsPaid(reg.getIsPaid());
                                    userRes.setPlayerCount(reg.getPlayerCount());
                                    userRes.setIsCancelled(reg.getIsCancelled());

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
        if (match.getCourt() == null || match.getCourt().getCourtPrices() == null || match.getCourt().getCourtPrices().isEmpty()) {
            return "Chưa cập nhật";
        }

        LocalDateTime matchStart = match.getStartTime();
        if (matchStart == null) {
            return "Chưa cập nhật";
        }

        LocalTime time = matchStart.toLocalTime();

        Optional<CourtPrice> bestPrice = match.getCourt().getCourtPrices().stream()
                .filter(cp -> cp.getStartTime() != null && cp.getEndTime() != null)
                .filter(cp -> {
                    boolean isAfterOrEqualStart = !time.isBefore(cp.getStartTime());
                    boolean isBeforeEnd = !time.isAfter(cp.getEndTime());
                    return isAfterOrEqualStart && isBeforeEnd;
                })
                .max(Comparator.comparing(CourtPrice::getPriority, Comparator.nullsFirst(Integer::compareTo)));

        return bestPrice.map(courtPrice -> courtPrice.getPricePerHour().toString()).orElse("Chưa cập nhật");
    }

    default AddressResponse toAddressResponse(Address address) {
        if (address == null) {
            return null;
        }

        return AddressResponse.builder()
                .street(address.getStreet())
                .ward(address.getWard())
                .city(address.getCity() == null ? null :
                        CityResponse.builder()
                                .cityId(address.getCity().getCityId())
                                .cityName(address.getCity().getCityName())
                                .build())
                .build();
    }
}