import 'package:dio/dio.dart';

import '../config/api_client.dart';
import '../models/news.dart';

class NewsService {
  final String _endpoint = '/news';

  Future<List<NewsModel>> getAll({
    int page = 0,
    int size = 10,
    String keyword = '',
  }) async {
    try {
      final response = await apiClient.get(
        _endpoint,
        queryParameters: {
          'page': page,
          'size': size,
          'keyword': keyword,
        },
      );

      final result = response.data['result'];

      final List list = result['data'] ??
          result['content'] ??
          result['items'] ??
          result ??
          [];

      return list
          .map((e) => NewsModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Không thể tải tin tức',
      );
    }
  }

  Future<NewsModel> getById(dynamic id) async {
    try {
      final response = await apiClient.get('$_endpoint/$id');

      return NewsModel.fromJson(
        Map<String, dynamic>.from(response.data['result']),
      );
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Không thể tải chi tiết tin tức',
      );
    }
  }
}

final newsService = NewsService();