import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_client.dart';

class AuthService {
  final String _endpoint = '/auth';

  Future<bool> login(String email, String password) async {
    try {
      final response = await apiClient.post(
        '$_endpoint/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data;

      if (response.statusCode == 200 && data['code'] == 200) {
        final String accessToken = data['result']['accessToken'];
        final String refreshToken = data['result']['refreshToken'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('accessToken', accessToken);
        await prefs.setString('refreshToken', refreshToken);

        return true;
      }

      throw Exception(data['message'] ?? 'Đăng nhập thất bại');
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e, 'Đăng nhập thất bại'));
    } catch (e) {
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<dynamic> sendRegisterOtp({
    required String userName,
    required String gender,
    required String email,
    required String password,
    required String phone,
    required String dateOfBirth,
  }) async {
    try {
      final response = await apiClient.post(
        '$_endpoint/register/request',
        data: {
          'userName': userName,
          'gender': gender,
          'email': email,
          'password': password,
          'phone': phone,
          'dateOfBirth': dateOfBirth,
          'roleName': 'RENTER',
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e, 'Không thể gửi mã OTP'));
    }
  }

  Future<dynamic> confirmRegister({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await apiClient.get(
        '$_endpoint/register/confirm',
        queryParameters: {
          'email': email,
          'otp': otp,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e, 'Xác thực OTP thất bại'));
    }
  }

  Future<dynamic> resendRegisterOtp(String email) async {
    try {
      final response = await apiClient.post(
        '$_endpoint/register/resend',
        queryParameters: {
          'email': email,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e, 'Không thể gửi lại mã OTP'));
    }
  }

  String _getErrorMessage(DioException e, String defaultMessage) {
    final data = e.response?.data;

    if (data is Map) {
      final result = data['result'];
      final errors = data['errors'];
      final message = data['message'];
      final error = data['error'];

      if (result is Map && result.isNotEmpty) {
        return result.values
            .where((value) => value != null)
            .map((value) => value.toString())
            .join('\n');
      }

      if (errors is Map && errors.isNotEmpty) {
        return errors.values
            .where((value) => value != null)
            .map((value) => value.toString())
            .join('\n');
      }

      if (errors is List && errors.isNotEmpty) {
        return errors
            .where((value) => value != null)
            .map((value) => value.toString())
            .join('\n');
      }

      if (message != null && message.toString().trim().isNotEmpty) {
        return message.toString();
      }

      if (error != null && error.toString().trim().isNotEmpty) {
        return error.toString();
      }
    }

    if (e.message != null && e.message!.trim().isNotEmpty) {
      return e.message!;
    }

    return defaultMessage;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
  }
}

final authService = AuthService();