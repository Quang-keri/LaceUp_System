package org.sport.backend.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.response.user.LeaderboardEntryResponse;
import org.sport.backend.dto.response.user.MyLeaderboardStatsResponse;
import org.sport.backend.entity.User;
import org.sport.backend.entity.UserCategoryRank;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.repository.UserCategoryRankRepository;
import org.sport.backend.service.LeaderboardService;
import org.sport.backend.service.UserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardServiceImpl implements LeaderboardService {

    private final UserCategoryRankRepository userCategoryRankRepository;
    private final UserService userService;

    @Override
    public List<LeaderboardEntryResponse> getTop100ByCategory(Integer categoryId) {
        List<UserCategoryRank> topRanks = userCategoryRankRepository
                .findTop100ByCategory_CategoryIdOrderByRankPointDesc(categoryId);

        return topRanks.stream().map(this::mapToLeaderboardEntry).collect(Collectors.toList());
    }

    @Override
    public MyLeaderboardStatsResponse getMyLeaderboardStats(Integer categoryId) {
        User currentUser = userService.getCurrentUserEntity();

        UserCategoryRank myRank = userCategoryRankRepository
                .findByUser_UserIdAndCategory_CategoryId(currentUser.getUserId(), categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        long totalUsers = userCategoryRankRepository.countByCategory_CategoryId(categoryId);
        long usersAboveMe = userCategoryRankRepository
                .countByCategory_CategoryIdAndRankPointGreaterThan(categoryId, myRank.getRankPoint());

        int myPosition = (int) (usersAboveMe + 1);

        double topPercentage = 0.0;
        if (totalUsers > 0) {
            topPercentage = ((double) myPosition / totalUsers) * 100.0;
            topPercentage = Math.round(topPercentage * 100.0) / 100.0;
        }

        return MyLeaderboardStatsResponse.builder()
                .currentRankPosition(myPosition)
                .totalUsersInCategory(totalUsers)
                .topPercentage(topPercentage)
                .myStats(mapToLeaderboardEntry(myRank))
                .build();
    }

    private LeaderboardEntryResponse mapToLeaderboardEntry(UserCategoryRank rank) {
        double winRate = 0.0;
        if (rank.getTotalMatches() > 0) {
            winRate = ((double) rank.getTotalWins() / rank.getTotalMatches()) * 100;
            winRate = Math.round(winRate * 100.0) / 100.0;
        }

        return LeaderboardEntryResponse.builder()
                .userId(rank.getUser().getUserId())
                .userName(rank.getUser().getUserName())
                .avatar(rank.getUser().getAvatar())
                .rankPoint(rank.getRankPoint())
                .displayRank(rank.resolveDisplayRank(null))
                .winRate(winRate)
                .currentWinStreak(rank.getCurrentWinStreak())
                .totalMatches(rank.getTotalMatches())
                .build();
    }
}