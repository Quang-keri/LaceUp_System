import 'package:dio/dio.dart';

import '../config/api_client.dart';
import '../models/account_deletion.dart';

class AccountDeletionService {
  Future<DeleteAccountResponse> requestAccountDeletion({
    String? password,
    String? reason,
  }) async {
    try {
      final normalizedPassword = password?.trim();
      final normalizedReason = reason?.trim();

      final response = await apiClient.post(
        '/users/me/account-deletion',
        data: {
          'password': normalizedPassword == null ||
              normalizedPassword.isEmpty
              ? null
              : normalizedPassword,
          'reason':
          normalizedReason == null || normalizedReason.isEmpty
              ? null
              : normalizedReason,
          'confirmation': 'XOA',
        },
      );

      final dynamic rawData = response.data;

      if (rawData is! Map) {
        throw const AccountDeletionException(
          'Dữ liệu phản hồi từ hệ thống không hợp lệ',
        );
      }

      final responseMap =
      Map<String, dynamic>.from(rawData);

      /*
       * Hỗ trợ response dạng ApiResponse:
       *
       * {
       *   "code": 200,
       *   "message": "...",
       *   "result": {
       *      "status": "COMPLETED",
       *      "message": "...",
       *      "blockers": []
       *   }
       * }
       *
       * Và response trả trực tiếp:
       *
       * {
       *   "status": "COMPLETED",
       *   "message": "...",
       *   "blockers": []
       * }
       */
      final dynamic rawResult = responseMap['result'];

      final Map<String, dynamic> result;

      if (rawResult is Map) {
        result = Map<String, dynamic>.from(rawResult);
      } else {
        result = responseMap;
      }

      return DeleteAccountResponse.fromJson(result);
    } on DioException catch (error) {
      throw AccountDeletionException(
        _extractErrorMessage(error),
      );
    } on AccountDeletionException {
      rethrow;
    } catch (error) {
      throw const AccountDeletionException(
        'Đã xảy ra lỗi khi xử lý yêu cầu xóa tài khoản',
      );
    }
  }

  String _extractErrorMessage(DioException error) {
    final dynamic data = error.response?.data;

    if (data is Map) {
      final map = Map<String, dynamic>.from(data);

      final backendMessage =
      map['message']?.toString().trim();

      if (backendMessage != null &&
          backendMessage.isNotEmpty) {
        return backendMessage;
      }

      final dynamic result = map['result'];

      if (result is Map) {
        final resultMap =
        Map<String, dynamic>.from(result);

        for (final value in resultMap.values) {
          final message = value?.toString().trim();

          if (message != null && message.isNotEmpty) {
            return message;
          }
        }
      }
    }

    switch (error.response?.statusCode) {
      case 400:
        return 'Thông tin xác nhận không hợp lệ.';
      case 401:
        return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bạn không có quyền thực hiện chức năng này.';
      case 404:
        return 'Không tìm thấy tài khoản.';
      case 409:
        return 'Tài khoản đang được xử lý hoặc đã được xóa.';
      case 500:
        return 'Hệ thống đang gặp lỗi. Vui lòng thử lại sau.';
      default:
        return 'Không thể gửi yêu cầu xóa tài khoản. Vui lòng thử lại.';
    }
  }
}