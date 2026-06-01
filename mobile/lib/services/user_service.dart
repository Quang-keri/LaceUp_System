import 'package:dio/dio.dart';
import '../config/api_client.dart';



class UserService {
  final String _endpoint = '/users';


  Future<dynamic> getMyInfo() async {
    try {
      final response = await apiClient.get('$_endpoint/my-info');
      return response.data['result'];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Lỗi kết nối máy chủ');
    }
  }

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
