class UserAchievementResponse {
  final String id;
  final String achievementCode;
  final String description;
  final String achievedAt;

  UserAchievementResponse({
    required this.id,
    required this.achievementCode,
    required this.description,
    required this.achievedAt,
  });

  factory UserAchievementResponse.fromJson(Map<String, dynamic> json) {
    return UserAchievementResponse(
      id: json['id']?.toString() ?? '',
      achievementCode: json['achievementCode']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      achievedAt: json['achievedAt']?.toString() ?? '',
    );
  }
}

class UserDashboardResponse {
  final String userId;
  final String userName;
  final String? avatarUrl;
  final int totalMatches;
  final int totalWins;
  final double winRate;
  final List<CategoryRank> categoryRanks;

  UserDashboardResponse({
    required this.userId,
    required this.userName,
    this.avatarUrl,
    required this.totalMatches,
    required this.totalWins,
    required this.winRate,
    required this.categoryRanks,
  });

  factory UserDashboardResponse.fromJson(Map<String, dynamic> json) {
    return UserDashboardResponse(
      userId: json['userId']?.toString() ?? '',
      userName: json['userName']?.toString() ?? '',
      avatarUrl: json['avatarUrl']?.toString(),
      totalMatches: json['totalMatches'] ?? 0,
      totalWins: json['totalWins'] ?? 0,
      winRate: (json['winRate'] ?? 0).toDouble(),
      categoryRanks: (json['categoryRanks'] as List? ?? [])
          .map((e) => CategoryRank.fromJson(e))
          .toList(),
    );
  }
}

class CategoryRank {
  final int categoryId;
  final String categoryName;
  final int rankPoint;
  final String displayRank;
  final int totalMatches;
  final int totalWins;
  final int currentWinStreak;
  final double winRate;

  CategoryRank({
    required this.categoryId,
    required this.categoryName,
    required this.rankPoint,
    required this.displayRank,
    required this.totalMatches,
    required this.totalWins,
    required this.currentWinStreak,
    required this.winRate,
  });

  factory CategoryRank.fromJson(Map<String, dynamic> json) {
    return CategoryRank(
      categoryId: json['categoryId'] ?? 0,
      categoryName: json['categoryName']?.toString() ?? '',
      rankPoint: json['rankPoint'] ?? 0,
      displayRank: json['displayRank']?.toString() ?? '',
      totalMatches: json['totalMatches'] ?? 0,
      totalWins: json['totalWins'] ?? 0,
      currentWinStreak: json['currentWinStreak'] ?? 0,
      winRate: (json['winRate'] ?? 0).toDouble(),
    );
  }
}