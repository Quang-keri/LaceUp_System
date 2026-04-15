import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// Thay thế AppConstants bằng file chứa biến môi trường/URL của bạn
import '../utils/constants.dart';

class UserService {
  final String _baseUrl = '${AppConstants.baseUrl}/users';

  // Lấy token từ local storage (tương đương với interceptor trong axios)
  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Lấy thông tin cá nhân (getMyInfo)
  Future<Map<String, dynamic>> getMyInfo() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/my-info'),
        headers: await _getHeaders(),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['result']};
      }
      return {'success': false, 'message': data['message']};
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // Cập nhật thông tin user (updateUser)
  Future<Map<String, dynamic>> updateUser(
    String userId,
    Map<String, dynamic> updateData,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/$userId'),
        headers: await _getHeaders(),
        body: jsonEncode(updateData),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['result']};
      }
      return {'success': false, 'message': data['message']};
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // Lấy Dashboard (getUserDashboard)
  Future<Map<String, dynamic>> getUserDashboard(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/$userId/dashboard'),
        headers: await _getHeaders(),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data['result']};
      }
      return {'success': false, 'message': data['message']};
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }
}
