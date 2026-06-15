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
import org.sport.backend.entity.User;

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
            hostResponse = UserResponse.builder()
                    .userId(match.getHost().getUserId())
                    .userName(match.getHost().getUserName())
                    .phone(match.getHost().getPhone())
                    .build();
        }

        UserResponse ownerCourtResponse = null;
        if (match.getCourt() != null && match.getCourt().getRentalArea() != null && match.getCourt().getRentalArea().getOwner() != null) {
            User owner = match.getCourt().getRentalArea().getOwner();

            BankAccountResponse bankAccountResponse = null;
            if (owner.getBankAccount() != null) {
                bankAccountResponse = BankAccountResponse.builder()
                        .bankAccountId(owner.getBankAccount().getBankAccountId())
                        .bankName(owner.getBankAccount().getBankName())
                        .accountNumber(owner.getBankAccount().getAccountNumber())
                        .accountHolderName(owner.getBankAccount().getAccountHolderName())
                        .branchName(owner.getBankAccount().getBranchName())
                        .qrCode(owner.getBankAccount().getQrCode())
                        .build();
            }

            ownerCourtResponse = UserResponse.builder()
                    .userId(owner.getUserId())
                    .userName(owner.getUserName())
                    .phone(owner.getPhone())
                    .bankAccount(bankAccountResponse)
                    .build();
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
                .ownerCourt(ownerCourtResponse)

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

                                    if (reg.getPayments() != null && !reg.getPayments().isEmpty()) {
                                        reg.getPayments().stream()
                                                .max(Comparator.comparing(org.sport.backend.entity.Payment::getTransactionDate))
                                                .ifPresent(payment -> {
                                                    if (payment.getPaymentStatus() != null) {
                                                        if (payment.getPaymentStatus() == org.sport.backend.constant.PaymentStatus.PENDING) {
                                                            if (payment.getProof() == null || payment.getProof().trim().isEmpty()) {
                                                                userRes.setPaymentStatus("UNPAID");
                                                            } else {
                                                                userRes.setPaymentStatus("PENDING");
                                                            }
                                                        } else {
                                                            userRes.setPaymentStatus(payment.getPaymentStatus().name());
                                                        }
                                                    }
                                                });
                                    }

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