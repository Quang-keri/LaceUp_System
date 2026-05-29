import '../config/api_client.dart';
import '../models/achievement.dart';

class AchievementService {
  Future<UserDashboardResponse> getUserDashboard(String userId) async {
    final res = await apiClient.get('/users/$userId/dashboard');

    return UserDashboardResponse.fromJson(res.data['result']);
  }

  Future<List<UserAchievementResponse>> getUserAchievements(String userId) async {
    final res = await apiClient.get('/achievements/$userId');

    final List data = res.data['result'] ?? [];

    return data.map((e) => UserAchievementResponse.fromJson(e)).toList();
  }

  Future<List<UserAchievementResponse>> getMyAchievements() async {
    final res = await apiClient.get('/achievements/me');

    final List data = res.data['result'] ?? [];

    return data.map((e) => UserAchievementResponse.fromJson(e)).toList();
  }

}

final achievementService = AchievementService();