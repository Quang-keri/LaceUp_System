import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

import '../config/api_client.dart';
import '../models/user_bank_account.dart';

class UserBankAccountService {
  UserBankAccountService({
    Dio? dio,
  }) : _dio = dio ?? apiClient;

  final Dio _dio;

  static const String _endpoint = '/bank-accounts';

  Future<UserBankAccount?> getUserBankAccount() async {
    try {
      final Response<dynamic> response =
      await _dio.get(_endpoint);

      final dynamic responseData = response.data;

      if (responseData == null) {
        return null;
      }

      final dynamic result = responseData is Map
          ? responseData['result']
          : responseData;

      if (result == null) {
        return null;
      }

      if (result is! Map) {
        throw Exception(
          'Dữ liệu tài khoản ngân hàng không hợp lệ',
        );
      }

      return UserBankAccount.fromJson(
        Map<String, dynamic>.from(result),
      );
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) {
        return null;
      }

      throw Exception(
        _getErrorMessage(
          error,
          fallback:
          'Không thể lấy tài khoản ngân hàng',
        ),
      );
    }
  }

  Future<UserBankAccount?> saveUserBankAccount({
    required UserBankAccount bankAccount,
    String? qrCodeFilePath,
  }) async {
    try {
      final String jsonData = jsonEncode(
        bankAccount.toJson(),
      );

      final FormData formData = FormData();

      // Tương đương:
      // formData.append(
      //   "data",
      //   new Blob([JSON.stringify(data)],
      //   { type: "application/json" })
      // );
      formData.files.add(
        MapEntry(
          'data',
          MultipartFile.fromString(
            jsonData,
            filename: 'data.json',
            contentType: MediaType(
              'application',
              'json',
            ),
          ),
        ),
      );

      if (qrCodeFilePath != null &&
          qrCodeFilePath.trim().isNotEmpty) {
        formData.files.add(
          MapEntry(
            'qrCodeFile',
            await MultipartFile.fromFile(
              qrCodeFilePath,
              filename: _getFileName(
                qrCodeFilePath,
              ),
            ),
          ),
        );
      }

      final Response<dynamic> response =
      await _dio.post(
        _endpoint,
        data: formData,
        options: Options(
          contentType:
          Headers.multipartFormDataContentType,
        ),
      );

      final dynamic responseData = response.data;

      if (responseData == null) {
        return null;
      }

      final dynamic result = responseData is Map
          ? responseData['result']
          : responseData;

      if (result == null || result is! Map) {
        return null;
      }

      return UserBankAccount.fromJson(
        Map<String, dynamic>.from(result),
      );
    } on DioException catch (error) {
      throw Exception(
        _getErrorMessage(
          error,
          fallback:
          'Không thể lưu tài khoản ngân hàng',
        ),
      );
    }
  }

  String _getFileName(String path) {
    return path
        .replaceAll('\\', '/')
        .split('/')
        .last;
  }

  String _getErrorMessage(
      DioException error, {
        required String fallback,
      }) {
    final dynamic data = error.response?.data;

    if (data is Map) {
      final dynamic message =
          data['message'] ??
              data['error'] ??
              data['desc'];

      if (message != null &&
          message.toString().trim().isNotEmpty) {
        return message.toString();
      }
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Kết nối quá thời gian, vui lòng thử lại';

      case DioExceptionType.connectionError:
        return 'Không thể kết nối đến máy chủ';

      case DioExceptionType.badResponse:
        final int? statusCode =
            error.response?.statusCode;

        if (statusCode == 400) {
          return 'Thông tin tài khoản ngân hàng không hợp lệ';
        }

        if (statusCode == 401) {
          return 'Phiên đăng nhập đã hết hạn';
        }

        if (statusCode == 403) {
          return 'Bạn không có quyền thực hiện chức năng này';
        }

        if (statusCode == 413) {
          return 'Ảnh QR có dung lượng quá lớn';
        }

        return fallback;

      default:
        return fallback;
    }
  }
}