// lib/services/auth_service.dart

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_client.dart'; // Import instance Dio dùng chung

class AuthService {
  // Thay vì lấy link đầy đủ từ AppConstants, dùng path nối với baseUrl của apiClient
  final String _endpoint = '/auth';

  /// Trả về [true] nếu đăng nhập thành công, ngược lại sẽ quăng ra lỗi (Exception)
  Future<bool> login(String email, String password) async {
    try {
      // 1. Gửi request (Dio tự động ép kiểu Map thành JSON và thêm Header Content-Type)
      final response = await apiClient.post('$_endpoint/login', data: {
        'email': email,
        'password': password,
      });

      // 2. Lấy data (Dio đã tự decode JSON thành Map, không cần jsonDecode thủ công)
      final data = response.data;

      if (response.statusCode == 200 && data['code'] == 200) {
        // 3. Lưu token
        final String accessToken = data['result']['accessToken'];
        final String refreshToken = data['result']['refreshToken'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('accessToken', accessToken);
        await prefs.setString('refreshToken', refreshToken);

        return true;
      } else {
        // Nếu API trả về code 200 nhưng logic bên trong báo lỗi (code != 200)
        throw Exception(data['message'] ?? 'Đăng nhập thất bại');
      }
    } on DioException catch (e) {
      // Bắt lỗi từ server (VD: Sai mật khẩu trả về 401, 400)
      throw Exception(e.response?.data['message'] ?? 'Lỗi kết nối hoặc sai thông tin');
    } catch (e) {
      // Bắt các lỗi vặt khác (lỗi lưu SharedPreferences, v.v.)
      throw Exception('Đã xảy ra lỗi hệ thống: $e');
    }
  }

  /// Tiện tay tặng bạn luôn hàm Đăng xuất (Logout) nhé
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    // Nếu BE của bạn có API /auth/logout để hủy token trên server, hãy gọi nó ở đây
  }
}

// Khởi tạo Singleton
final authService = AuthService();