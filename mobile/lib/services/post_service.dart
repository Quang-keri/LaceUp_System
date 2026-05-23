
import 'package:dio/dio.dart';
import '../config/api_client.dart';
import '../models/page_response.dart';
import '../models/post.dart';

class PostService {
  final String _endpoint = '/posts';

  Future<PageResponse<PostResponse>> getPosts({
    int page = 1,
    int size = 10,
    String? title,
    double? minPrice,
    double? maxPrice,
    String? sortBy,
    List<int>? cityIds,
    List<int>? categoryIds,
    List<int>? amenityIds,
    double? minRating,
  }) async {
    final Map<String, dynamic> params = {
      'page': page,
      'size': size,
    };

    if (title != null && title.isNotEmpty) params['title'] = title;
    if (minPrice != null) params['minPrice'] = minPrice;
    if (maxPrice != null) params['maxPrice'] = maxPrice;
    if (sortBy != null && sortBy.isNotEmpty) params['sortBy'] = sortBy;
    if (minRating != null) params['minRating'] = minRating;

    if (cityIds != null && cityIds.isNotEmpty) {
      params['cityIds'] = cityIds.join(',');
    }

    if (categoryIds != null && categoryIds.isNotEmpty) {
      params['categoryIds'] = categoryIds.join(',');
    }

    if (amenityIds != null && amenityIds.isNotEmpty) {
      params['amenityIds'] = amenityIds.join(',');
    }

    try {
      final response = await apiClient.get(
        '/posts',
        queryParameters: params,
      );

      final resultData = response.data['result'];

      return PageResponse<PostResponse>.fromJson(
        resultData,
            (json) => PostResponse.fromJson(json),
      );
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Lỗi khi tải danh sách bài đăng',
      );
    }
  }

  Future<List<PostResponse>> getMyPosts({String? status}) async {
    try {
      Map<String, dynamic> params = {};
      if (status != null) params['status'] = status;

      final response = await apiClient.get('$_endpoint/me', queryParameters: params);

      final List<dynamic> data = response.data['result'] ?? response.data['data'] ?? [];
      return data.map((json) => PostResponse.fromJson(json)).toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi khi tải bài viết cá nhân');
    }
  }

  Future<PostResponse> getMyPostDetail(String postId) async {
    try {
      final response = await apiClient.get('$_endpoint/me/$postId');
      return PostResponse.fromJson(response.data['result'] ?? response.data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Không tìm thấy thông tin sân');
    }
  }

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