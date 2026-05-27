import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_client.dart';

class AuthService {
  final String _endpoint = '/auth';

  Future<bool> login(String email, String password) async {
    try {
      final response = await apiClient.post('$_endpoint/login', data: {
        'email': email,
        'password': password,
      });

      final data = response.data;

      if (response.statusCode == 200 && data['code'] == 200) {
        final String accessToken = data['result']['accessToken'];
        final String refreshToken = data['result']['refreshToken'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('accessToken', accessToken);
        await prefs.setString('refreshToken', refreshToken);

        return true;
      } else {
        throw Exception(data['message'] ?? 'Đăng nhập thất bại');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi kết nối hoặc sai thông tin');
    }
  }

  Future<void> sendRegisterOtp({
    required String userName,
    required String gender,
    required String email,
    required String password,
    required String phone,
    required String dateOfBirth,
    String roleName = 'RENTER',
  }) async {
    try {
      final response = await apiClient.post('$_endpoint/register/request', data: {
        'userName': userName,
        'gender': gender,
        'email': email,
        'password': password,
        'phone': phone,
        'dateOfBirth': dateOfBirth,
        'roleName': roleName,
      });

      final data = response.data;

      if (data['code'] != 200) {
        throw Exception(data['message'] ?? 'Gửi OTP thất bại');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Gửi OTP thất bại');
    }
  }

  Future<void> confirmRegister({
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

      final data = response.data;

      if (data['code'] != 200) {
        throw Exception(data['message'] ?? 'Xác thực OTP thất bại');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'OTP không đúng hoặc đã hết hạn');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
  }
}

final authService = AuthService();