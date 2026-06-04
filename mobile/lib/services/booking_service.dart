import 'package:dio/dio.dart';
import '../config/api_client.dart';
import 'package:flutter/material.dart';
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

      debugPrint('UPLOAD SUCCESS = ${response.data}');
      return response.data;
    } on DioException catch (e) {
      debugPrint('UPLOAD ERROR STATUS = ${e.response?.statusCode}');
      debugPrint('UPLOAD ERROR DATA = ${e.response?.data}');
      debugPrint('UPLOAD ERROR MESSAGE = ${e.message}');
      debugPrint('UPLOAD ERROR URL = ${e.requestOptions.uri}');
      debugPrint('UPLOAD ERROR HEADERS = ${e.requestOptions.headers}');

      throw Exception(
        e.response?.data?['message'] ??
            e.response?.data?.toString() ??
            e.message ??
            'Upload ảnh thất bại',
      );
    } catch (e) {
      debugPrint('UPLOAD UNKNOWN ERROR = $e');
      throw Exception('Upload ảnh thất bại: $e');
    }
  }

  Future<dynamic> getMyBookingIntents() async {
    try {
      final response = await apiClient.get('/bookings/intent/my-intents');
      // IN KIỂU DỮ LIỆU RA ĐÂY ĐỂ CHECK
      debugPrint('KIỂU DỮ LIỆU CỦA DATA: ${response.data.runtimeType}');
      debugPrint('DỮ LIỆU THẬT: ${response.data}');
      return response.data['result'] ?? [];
    } on DioException catch (e) {
      throw Exception(
        e.response?.data['message'] ?? 'Không thể tải đơn chờ xác nhận',
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
        '/bookings/my-bookings',
        queryParameters: {
          if (status != null) 'bookingStatus': status,
          if (fromDate != null) 'from': fromDate,
          if (toDate != null) 'to': toDate,
          if (keyword != null) 'keyword': keyword,
          'page': page,
          'size': size,
        },
      );


      return response.data['result'] ?? response.data;

    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['message'] ?? 'Không thể tải lịch sử đặt sân',
      );
    }
  }

  Future<dynamic> cancelBooking(String bookingId) async {
    try {
      final response = await apiClient.put('/bookings/$bookingId/cancel');
      return response.data;
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['message'] ?? 'Không thể hủy đặt sân',
      );
    }
  }
}

final bookingService = BookingService();