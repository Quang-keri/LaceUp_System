import 'package:dio/dio.dart';

import '../config/api_client.dart';
import '../models/review.dart';

class ReviewService {
  Future<ReviewPage> getReviewsByRentalArea(
    String rentalAreaId, {
    int page = 0,
    int size = 5,
  }) async {
    try {
      final response = await apiClient.get(
        '/reviews/rental/$rentalAreaId',
        queryParameters: {'page': page, 'size': size},
      );

      final dynamic result = _unwrapResult(response.data);
      final Map<String, dynamic> resultMap = _toMap(result);

      return ReviewPage.fromJson(resultMap);
    } on DioException catch (error) {
      throw Exception(
        _getErrorMessage(error, 'Không thể tải danh sách đánh giá.'),
      );
    }
  }

  Future<bool> checkEligibility(String rentalAreaId) async {
    try {
      final response = await apiClient.get(
        '/reviews/check-eligibility/$rentalAreaId',
      );

      final dynamic result = _unwrapResult(response.data);

      if (result is bool) {
        return result;
      }

      if (result is String) {
        return result.toLowerCase() == 'true';
      }

      if (result is Map) {
        final map = Map<String, dynamic>.from(result);

        return map['eligible'] == true || map['isEligible'] == true;
      }

      return false;
    } on DioException catch (error) {
      throw Exception(
        _getErrorMessage(error, 'Không thể kiểm tra quyền đánh giá.'),
      );
    }
  }

  Future<ReviewData?> getMyReview(String rentalAreaId) async {
    try {
      final response = await apiClient.get('/reviews/me/rental/$rentalAreaId');

      final dynamic result = _unwrapResult(response.data);

      if (result == null) {
        return null;
      }

      if (result is Map) {
        // CHẶN BỔ SUNG: Đảm bảo Map này thực sự là data Review chứ không phải vỏ bọc API
        if (!result.containsKey('reviewId') &&
            !result.containsKey('id') &&
            !result.containsKey('rating')) {
          return null;
        }

        return ReviewData.fromJson(Map<String, dynamic>.from(result));
      }

      return null;
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) {
        return null;
      }

      throw Exception(
        _getErrorMessage(error, 'Không thể tải đánh giá của bạn.'),
      );
    }
  }

  Future<void> submitReview({
    required String rentalAreaId,
    required int rating,
    required String comment,
  }) async {
    try {
      await apiClient.post(
        '/reviews/rental/$rentalAreaId',
        data: {'rating': rating, 'comment': comment.trim()},
      );
    } on DioException catch (error) {
      throw Exception(_getErrorMessage(error, 'Không thể gửi đánh giá.'));
    }
  }

  dynamic _unwrapResult(dynamic data) {
    if (data is Map) {
      if (data.containsKey('result')) {
        return data['result'];
      }

      // XỬ LÝ LỖI MẤT FIELD: Nếu backend ẩn field result do null,
      // nhưng vẫn còn vỏ code/message/status thì trả về null.
      if (data.containsKey('code') || data.containsKey('message') || data.containsKey('status')) {
        return null;
      }
    }

    return data;
  }

  Map<String, dynamic> _toMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return {};
  }

  String _getErrorMessage(DioException error, String fallback) {
    final dynamic data = error.response?.data;

    if (data is Map) {
      final map = Map<String, dynamic>.from(data);

      final dynamic message =
          map['message'] ?? map['error'] ?? map['description'];

      if (message != null && message.toString().trim().isNotEmpty) {
        return message.toString().trim();
      }
    }

    if (data is String && data.trim().isNotEmpty) {
      return data.trim();
    }

    return error.message ?? fallback;
  }
}

final ReviewService reviewService = ReviewService();
