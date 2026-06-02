import 'package:dio/dio.dart';
import '../config/api_client.dart';

class BookingService {
  // Future<dynamic> createBookingIntent({
  //   required String userName,
  //   required String userPhone,
  //   required String note,
  //   required List<Map<String, dynamic>> slotRequests,
  // }) async {
  //   try {
  //     final payload = {
  //       'userName': userName,
  //       'userPhone': userPhone,
  //       'note': note,
  //       'slotRequests': slotRequests,
  //     };
  //
  //     final response = await apiClient.post(
  //       '/bookings/intent',
  //       data: payload,
  //     );
  //
  //     return response.data;
  //   } on DioException catch (e) {
  //     throw Exception(
  //       e.response?.data['message'] ?? 'Đặt sân thất bại',
  //     );
  //   } catch (e) {
  //     throw Exception('Lỗi xử lý đặt sân: $e');
  //   }
  // }

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
      throw Exception(e.response?.data['message'] ?? 'Đặt sân thất bại');
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
      throw Exception(e.response?.data['message'] ?? 'Upload ảnh thất bại');
    }
  }
}

final bookingService = BookingService();