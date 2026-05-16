import 'package:dio/dio.dart';
import '../config/api_client.dart';

// Nhớ tạo UserModel tương tự như PostResponse nhé!
// import '../models/user.dart';

class UserService {
  final String _endpoint = '/users';

  // Lấy thông tin cá nhân
  Future<dynamic> getMyInfo() async {
    try {
      final response = await apiClient.get('$_endpoint/my-info');
      // Tốt nhất là: return UserModel.fromJson(response.data['result']);
      return response.data['result'];
    } on DioException catch (e) {
      // Bắt lỗi Dio cụ thể
      throw Exception(e.response?.data['message'] ?? 'Lỗi kết nối máy chủ');
    }
  }

  // Cập nhật thông tin user
  Future<dynamic> updateUser(
    String userId,
    Map<String, dynamic> updateData,
  ) async {
    try {
      final response = await apiClient.put(
        '$_endpoint/$userId',
        data: updateData,
      );
      return response.data['result'];
    } catch (e) {
      throw Exception('Không thể cập nhật: $e');
    }
  }

  // Lấy Dashboard
  Future<dynamic> getUserDashboard(String userId) async {
    try {
      final response = await apiClient.get('$_endpoint/$userId/dashboard');
      return response.data['result'];
    } catch (e) {
      throw Exception('Không thể lấy dashboard: $e');
    }
  }
}

final userService = UserService();
