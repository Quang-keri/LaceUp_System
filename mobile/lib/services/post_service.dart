// lib/services/post_service.dart

import 'package:dio/dio.dart';
import '../config/api_client.dart'; // Import apiClient dùng chung
import '../models/page_response.dart';
import '../models/post.dart';

class PostService {
  final String _endpoint = '/posts';

  // Trả về thẳng PageResponse<PostResponse> thay vì dynamic
  Future<PageResponse<PostResponse>> getPosts(Map<String, dynamic> filters) async {
    Map<String, dynamic> params = Map.from(filters);

    if (params['cityIds'] is List) params['cityIds'] = params['cityIds'].join(',');
    if (params['categoryIds'] is List) params['categoryIds'] = params['categoryIds'].join(',');
    if (params['amenityIds'] is List) params['amenityIds'] = params['amenityIds'].join(',');

    params.removeWhere((key, value) => value == null || value == '');

    try {
      final response = await apiClient.get(_endpoint, queryParameters: params);

      // 1. Trích xuất cục "result" từ JSON gốc
      final resultData = response.data['result'];

      // 2. Parse cục result đó thành PageResponse
      return PageResponse<PostResponse>.fromJson(
        resultData,
            (json) => PostResponse.fromJson(json),
      );
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi tải danh sách sân');
    } catch (e) {
      throw Exception('Lỗi xử lý dữ liệu: $e');
    }
  }

  // Lấy danh sách bài viết của tôi
  Future<List<PostResponse>> getMyPosts({String? status}) async {
    try {
      Map<String, dynamic> params = {};
      if (status != null) params['status'] = status;

      final response = await apiClient.get('$_endpoint/me', queryParameters: params);

      // Cập nhật lại key 'data' hay 'result' tùy thuộc vào JSON thực tế backend trả về
      final List<dynamic> data = response.data['result'] ?? response.data['data'] ?? [];
      return data.map((json) => PostResponse.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi tải bài viết cá nhân');
    }
  }

  // Lấy chi tiết bài viết của tôi
  Future<PostResponse> getMyPostDetail(String postId) async {
    try {
      final response = await apiClient.get('$_endpoint/me/$postId');
      // Trả về thẳng Model thay vì dynamic
      return PostResponse.fromJson(response.data['result'] ?? response.data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Không tìm thấy thông tin sân');
    }
  }

  // Tạo bài viết mới
  Future<dynamic> createPost({
    required String title,
    required String description,
    required String courtId,
  }) async {
    try {
      final response = await apiClient.post(_endpoint, data: {
        'title': title,
        'description': description,
        'courtId': courtId,
      });
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi tạo bài viết');
    }
  }

  // Cập nhật bài viết
  Future<dynamic> updatePost(
      String postId, {
        String? title,
        String? description,
        String? postStatus,
      }) async {
    try {
      Map<String, dynamic> data = {};
      if (title != null) data['title'] = title;
      if (description != null) data['description'] = description;
      if (postStatus != null) data['postStatus'] = postStatus;

      final response = await apiClient.put('$_endpoint/$postId', data: data);
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi cập nhật bài viết');
    }
  }

  // Xóa bài viết
  Future<dynamic> deletePost(String postId) async {
    try {
      final response = await apiClient.delete('$_endpoint/$postId');
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi xóa bài viết');
    }
  }
}

final postService = PostService();