class LeaderboardEntryResponse {
  final String userId;
  final String userName;
  final String? avatar;
  final int rankPoint;
  final String? displayRank;
  final double winRate;
  final int currentWinStreak;
  final int totalMatches;

  LeaderboardEntryResponse({
    required this.userId,
    required this.userName,
    this.avatar,
    required this.rankPoint,
    this.displayRank,
    required this.winRate,
    required this.currentWinStreak,
    required this.totalMatches,
  });

  factory LeaderboardEntryResponse.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntryResponse(
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? 'Unknown',
      avatar: json['avatar'],
      rankPoint: json['rankPoint'] ?? 0,
      displayRank: json['displayRank'],
      winRate: (json['winRate'] ?? 0).toDouble(),
      currentWinStreak: json['currentWinStreak'] ?? 0,
      totalMatches: json['totalMatches'] ?? 0,
    );
  }
}

class MyLeaderboardStatsResponse {
  final int currentRankPosition;
  final int totalUsersInCategory;
  final double topPercentage;
  final LeaderboardEntryResponse? myStats;

  MyLeaderboardStatsResponse({
    required this.currentRankPosition,
    required this.totalUsersInCategory,
    required this.topPercentage,
    this.myStats,
  });

  factory MyLeaderboardStatsResponse.fromJson(Map<String, dynamic> json) {
    return MyLeaderboardStatsResponse(
      currentRankPosition: json['currentRankPosition'] ?? 0,
      totalUsersInCategory: json['totalUsersInCategory'] ?? 0,
      topPercentage: (json['topPercentage'] ?? 0).toDouble(),
      myStats: json['myStats'] != null
          ? LeaderboardEntryResponse.fromJson(json['myStats'])
          : null,
    );
  }
}
