package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
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
    AddressMapper addressMapper = Mappers.getMapper(AddressMapper.class);

    default MatchResponse toResponse(Match match) {
        if (match == null) return null;

        return MatchResponse.builder()
                .matchId(match.getMatchId())
                .courtName(match.getCourt() != null ? match.getCourt().getCourtName() : "Sân tự thỏa thuận")
                .address(addressMapper.toAddressResponse(match.getAddress()))
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
                .winnerPercent(match.getWinnerPercent())
                .minRank(match.getMinRank())
                .maxRank(match.getMaxRank())

                .participants(match.getRegistrations() == null ? Collections.emptyList() :
                        match.getRegistrations().stream()
                                .map(reg -> {
                                    var userRes = userMapper.toUserResponse(reg.getUser());

                                    userRes.setDepositConfirmed(reg.getIsDepositConfirmed());

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
        System.out.println("=== BẮT ĐẦU TÌM GIÁ SÂN CHO MATCH ===");

        if (match.getCourt() == null) {
            System.out.println("-> [LỖI] Trận đấu không gắn với Court nào (match.getCourt() == null)");
            return "Chưa cập nhật";
        }
        System.out.println("-> ID Sân: " + match.getCourt().getCourtId());

        if (match.getCourt().getCourtPrices() == null) {
            System.out.println("-> [LỖI] Danh sách CourtPrices bị NULL (Có thể do lỗi Fetch dữ liệu)");
            return "Chưa cập nhật";
        }
        if (match.getCourt().getCourtPrices().isEmpty()) {
            System.out.println("-> [LỖI] Danh sách CourtPrices TRỐNG (size = 0). Hãy kiểm tra xem sân này đã được tạo giá trong DB chưa, hoặc có bị lỗi Lazy Loading không.");
            return "Chưa cập nhật";
        }
        System.out.println("-> Tổng số mốc giá của sân: " + match.getCourt().getCourtPrices().size());

        LocalDateTime matchStart = match.getStartTime();
        if (matchStart == null) {
            System.out.println("-> [LỖI] Trận đấu không có startTime");
            return "Chưa cập nhật";
        }

        LocalTime time = matchStart.toLocalTime();
        System.out.println("-> Thời gian bắt đầu trận cần tìm giá (LocalTime): " + time);

        System.out.println("--- Danh sách các mốc giá đang có ---");
        for (CourtPrice cp : match.getCourt().getCourtPrices()) {
            System.out.printf("   + ID: %s | Start: %s | End: %s | Price: %s | Priority: %s%n",
                    cp.getCourtPriceId(), cp.getStartTime(), cp.getEndTime(), cp.getPricePerHour(), cp.getPriority());
        }
        System.out.println("-------------------------------------");

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
            System.out.println("-> [THÀNH CÔNG] Đã chọn được giá: " + bestPrice.get().getPricePerHour());
            return bestPrice.get().getPricePerHour().toString();
        } else {
            System.out.println("-> [LỖI TỪ CHỐI] Không có khung giá nào bao phủ được giờ " + time);
            return "Chưa cập nhật";
        }
    }
}