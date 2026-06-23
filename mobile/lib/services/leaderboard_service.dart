import '../config/api_client.dart';
import '../models/leaderboard_model.dart';

class LeaderboardService {
  final String _baseUrl = '/leaderboards';

  Future<List<LeaderboardEntryResponse>> getTop100ByCategory(
    int categoryId,
  ) async {
    final res = await apiClient.get('$_baseUrl/$categoryId/top100');
    final data = res.data['result'] as List;
    return data.map((json) => LeaderboardEntryResponse.fromJson(json)).toList();
  }

  Future<MyLeaderboardStatsResponse> getMyLeaderboardStats(
    int categoryId,
  ) async {
    final res = await apiClient.get('$_baseUrl/$categoryId/me');
    return MyLeaderboardStatsResponse.fromJson(res.data['result']);
  }
}

final leaderboardService = LeaderboardService();
