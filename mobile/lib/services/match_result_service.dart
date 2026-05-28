import '../config/api_client.dart';
import '../models/match_result.dart';

class MatchResultService {
  final String _baseUrl = '/match-results';

  Future<MatchResultResponse> submitMatchResult(
      String matchId,
      int winningTeamNumber, [
        List<String> absentUserIds = const [],
      ]) async {
    final payload = MatchResultRequest(
      matchId: matchId,
      winningTeamNumber: winningTeamNumber,
      absentUserIds: absentUserIds,
    );

    final res = await apiClient.post('$_baseUrl/submit', data: payload.toJson());
    return MatchResultResponse.fromJson(res.data['result']);
  }

  Future<MatchResultResponse> respondToResult(String resultId, bool isAccepted) async {
    final res = await apiClient.post(
      '$_baseUrl/$resultId/respond',
      queryParameters: {'isAccepted': isAccepted},
    );
    return MatchResultResponse.fromJson(res.data['result']);
  }

  Future<List<MatchResultResponse>> getResultsByMatch(String matchId) async {
    final res = await apiClient.get('$_baseUrl/match/$matchId');
    final data = res.data['result'] as List;
    return data.map((json) => MatchResultResponse.fromJson(json)).toList();
  }
}

final matchResultService = MatchResultService();