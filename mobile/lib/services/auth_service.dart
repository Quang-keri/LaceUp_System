// lib/services/auth_service.dart

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
    } catch (e) {
      throw Exception('Đã xảy ra lỗi hệ thống: $e');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    // Nếu BE của bạn có API /auth/logout để hủy token trên server, hãy gọi nó ở đây
  }
}

// Khởi tạo Singleton
final authService = AuthService();