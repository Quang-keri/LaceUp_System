
import 'package:dio/dio.dart';
import '../config/api_client.dart';
import '../models/rental_area.dart';

class RentalService {
  final String _endpoint = '/rental-areas';

  Future<RentalAreaResponse> getRentalAreaById(String id) async {
    try {
      final response = await apiClient.get('$_endpoint/$id');
      final data = response.data['result'] ?? response.data;
      return RentalAreaResponse.fromJson(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Không thể tải thông tin khu vực sân');
    } catch (e) {
      throw Exception('Lỗi xử lý dữ liệu: $e');
    }
  }
}

final rentalService = RentalService();