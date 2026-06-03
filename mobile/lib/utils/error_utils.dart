import 'package:dio/dio.dart';

String getErrorMessage(dynamic error) {
  if (error is DioException) {
    final data = error.response?.data;

    if (data is Map) {
      final result = data['result'];

      if (result is Map && result.isNotEmpty) {
        return result.values
            .map((e) => e.toString())
            .join('\n');
      }

      return data['message']?.toString() ??
          data['error']?.toString() ??
          'Có lỗi xảy ra';
    }

    return data?.toString() ??
        error.message ??
        'Có lỗi xảy ra';
  }

  return error.toString().replaceAll('Exception: ', '');
}

