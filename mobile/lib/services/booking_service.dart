import 'package:dio/dio.dart';
import '../config/api_client.dart';

class BookingService {
  Future<dynamic> getBookingIntent(String bookingIntentId) async {
    try {
      final response = await apiClient.get(
        '/bookings/intent/$bookingIntentId',
      );

      return response.data['result'] ?? response.data;
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Không thể tải thông tin thanh toán',
      );
    }
  }

  Future<dynamic> createBookingIntent({
    required String userName,
    required String userPhone,
    required String note,
    required List<Map<String, dynamic>> slotRequests,
  }) async {
    try {
      final response = await apiClient.post(
        '/bookings/intent',
        data: {
          'userName': userName,
          'userPhone': userPhone,
          'note': note,
          'slotRequests': slotRequests,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Tạo yêu cầu đặt sân thất bại',
      );
    }
  }

  Future<dynamic> getMyBookingIntents() async {
    try {
      final response = await apiClient.get('/bookings/intent/me');
      return response.data;
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Không thể tải đơn chờ xác nhận',
      );
    }
  }

  Future<dynamic> uploadPaymentProof({
    required String bookingIntentId,
    required String imagePath,
  }) async {
    try {
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(imagePath),
      });

      final response = await apiClient.post(
        '/bookings/intent/$bookingIntentId/payment-proof',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Upload ảnh thất bại',
      );
    }
  }

  Future<dynamic> getMyBookings(
      String? status,
      String? fromDate,
      String? toDate,
      String? keyword,
      int page,
      int size,
      ) async {
    try {
      final response = await apiClient.get(
        '/bookings/me',
        queryParameters: {
          if (status != null) 'status': status,
          if (fromDate != null) 'fromDate': fromDate,
          if (toDate != null) 'toDate': toDate,
          if (keyword != null) 'keyword': keyword,
          'page': page,
          'size': size,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Không thể tải lịch sử đặt sân',
      );
    }
  }
}

final bookingService = BookingService();