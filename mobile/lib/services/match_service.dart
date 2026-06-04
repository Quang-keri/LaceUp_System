import 'package:dio/dio.dart';

import '../config/api_client.dart';
import '../models/match.dart';
import '../models/page_response.dart';

class MatchService {
  final String _baseUrl = '/matches';

  Future<MatchResponse> createMatch(MatchRequest data) async {
    final res = await apiClient.post('$_baseUrl/create', data: data.toJson());
    return MatchResponse.fromJson(res.data['result']);
  }

  Future<dynamic> joinMatch(String matchId, [int playerCount = 1]) async {
    try {
      final res = await apiClient.post(
        '$_baseUrl/$matchId/join',
        data: {'playerCount': playerCount},
      );
      return res.data['result'];
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Bạn chưa đăng nhập hoặc phiên đã hết hạn!');
      }
      throw Exception(e.response?.data['message'] ?? 'Lỗi không xác định.');
    }
  }

  Future<void> divideTeams(
    String matchId,
    List<String> team1UserIds,
    List<String> team2UserIds,
  ) async {
    await apiClient.post(
      '$_baseUrl/$matchId/divide-teams',
      data: {'team1UserIds': team1UserIds, 'team2UserIds': team2UserIds},
    );
  }

  Future<PageResponse<MatchResponse>> getOpenMatches({
    int? page,
    int? size,
    String? category,
    String? keyword,
    String? startDate,
    String? endDate,
    String? matchType,
    String? city,
    String? district,
    String? ward,
  }) async {
    final params = <String, dynamic>{
      if (page != null) 'page': page,
      if (size != null) 'size': size,
      if (category != null) 'category': category,
      if (keyword != null) 'keyword': keyword,
      if (startDate != null) 'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
      if (matchType != null) 'matchType': matchType,
      if (city != null) 'city': city,
      if (district != null) 'district': district,
      if (ward != null) 'ward': ward,
    };

    final res = await apiClient.get('$_baseUrl/open', queryParameters: params);
    return PageResponse<MatchResponse>.fromJson(
      res.data['result'],
      (json) => MatchResponse.fromJson(json),
    );
  }

  Future<MatchResponse> getMatchDetail(String matchId) async {
    final res = await apiClient.get('$_baseUrl/$matchId');
    return MatchResponse.fromJson(res.data['result']);
  }

  Future<PageResponse<MatchResponse>> getAllMatches({
    required int page,
    required int size,
    String? status,
    String? category,
    String? matchType,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'size': size,
      if (status != null) 'status': status,
      if (category != null && category != "Tất cả") 'category': category,
      if (matchType != null && matchType != "ALL") 'matchType': matchType,
    };

    final res = await apiClient.get(_baseUrl, queryParameters: params);
    return PageResponse<MatchResponse>.fromJson(
      res.data['result'],
      (json) => MatchResponse.fromJson(json),
    );
  }

  Future<PageResponse<MatchResponse>> getOwnerMatches({
    required int page,
    required int size,
    String? status,
    String? category,
    String? keyword,
    String? startDate,
    String? endDate,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'size': size,
      if (status != null) 'status': status,
      if (category != null) 'category': category,
      if (keyword != null) 'keyword': keyword,
      if (startDate != null) 'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
    };

    final res = await apiClient.get('$_baseUrl/owner', queryParameters: params);
    return PageResponse<MatchResponse>.fromJson(
      res.data['result'],
      (json) => MatchResponse.fromJson(json),
    );
  }

  Future<PageResponse<MatchResponse>> getMyMatches(int page, int size) async {
    final res = await apiClient.get(
      '$_baseUrl/my-matches',
      queryParameters: {'page': page, 'size': size},
    );
    return PageResponse<MatchResponse>.fromJson(
      res.data['result'],
      (json) => MatchResponse.fromJson(json),
    );
  }

  Future<PageResponse<MatchResponse>> getUserMatchHistory(
    String userId,
    int page,
    int size,
  ) async {
    final res = await apiClient.get(
      '$_baseUrl/user/$userId/history',
      queryParameters: {'page': page, 'size': size},
    );
    return PageResponse<MatchResponse>.fromJson(
      res.data['result'],
      (json) => MatchResponse.fromJson(json),
    );
  }

  Future<void> joinMatchByCode(String roomCode) async {
    await apiClient.post(
      '$_baseUrl/join/code',
      queryParameters: {'roomCode': roomCode},
    );
  }

  Future<MatchResponse> autoMatch({
    required int categoryId,
    required String matchType,
    String? city,
    String? district,
  }) async {
    final data = {
      'categoryId': categoryId,
      'matchType': matchType,
      if (city != null) 'city': city,
      if (district != null) 'district': district,
    };
    final res = await apiClient.post('$_baseUrl/auto-match', data: data);
    return MatchResponse.fromJson(res.data['result']);
  }

  Future<dynamic> submitResult({
    required String matchId,
    required int winningTeamNumber,
    required List<String> absentUserIds,
  }) async {
    final res = await apiClient.post(
      '/match-results/submit',
      data: {
        'matchId': matchId,
        'winningTeamNumber': winningTeamNumber,
        'absentUserIds': absentUserIds,
      },
    );
    return res.data['result'] ?? res.data;
  }

  Future<void> reportViolation(ReportRequest data) async {
    await apiClient.post('/match-results/report', data: data.toJson());
  }

  Future<void> resolveMatchReport(String reportId, bool isAccepted) async {
    await apiClient.post(
      '/match-results/report/$reportId/resolve',
      queryParameters: {'isAccepted': isAccepted},
    );
  }

  Future<void> leaveMatch(String matchId) async {
    try {
      await apiClient.post('$_baseUrl/$matchId/leave');
    } catch (e) {
      rethrow;
    }
  }
}

final matchService = MatchService();
