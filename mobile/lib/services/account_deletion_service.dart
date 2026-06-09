import 'package:dio/dio.dart';
import 'package:mobile/config/api_client.dart';
import 'package:mobile/models/account_deletion.dart';

class AccountDeletionService {

  final String endpoint;

  const AccountDeletionService({
    this.endpoint = '/users/me/account-deletion',
  });

  Future<DeleteAccountResponse> requestAccountDeletion() async {
    try {
      final response = await apiClient.post(endpoint);

      final Map<String, dynamic> responseMap =
      _toStringDynamicMap(response.data);

      final dynamic rawResult = responseMap['result'];

      final Map<String, dynamic> resultMap = rawResult is Map
          ? Map<String, dynamic>.from(rawResult)
          : responseMap;

      if (resultMap['status'] == null) {
        throw const AccountDeletionException(
          'Phản hồi xóa tài khoản không hợp lệ.',
        );
      }

      return DeleteAccountResponse.fromJson(resultMap);
    } on AccountDeletionException {
      rethrow;
    } on DioException catch (error) {
      throw AccountDeletionException(
        _extractErrorMessage(error),
      );
    } catch (_) {
      throw const AccountDeletionException(
        'Không thể gửi yêu cầu xóa tài khoản. Vui lòng thử lại.',
      );
    }
  }

  Map<String, dynamic> _toStringDynamicMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    throw const AccountDeletionException(
      'Máy chủ trả về dữ liệu không hợp lệ.',
    );
  }

  String _extractErrorMessage(DioException error) {
    final dynamic responseData = error.response?.data;

    if (responseData is Map) {
      final Map<String, dynamic> data =
      Map<String, dynamic>.from(responseData);

      final dynamic rawResult = data['result'];

      final dynamic message =
          data['message'] ??
              data['error'] ??
              data['desc'] ??
              (rawResult is Map ? rawResult['message'] : null);

      if (message != null && message.toString().trim().isNotEmpty) {
        return message.toString().trim();
      }
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Kết nối quá thời gian. Vui lòng thử lại.';
      case DioExceptionType.connectionError:
        return 'Không thể kết nối đến máy chủ.';
      default:
        return 'Không thể gửi yêu cầu xóa tài khoản. Vui lòng thử lại.';
    }
  }
}
