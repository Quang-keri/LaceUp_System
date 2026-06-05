import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../config/api_client.dart';

class PaymentService {
  static const String _baseUrl = '/payments';

  Future<dynamic> checkoutPayment({
    required String bookingIntentId,
    required String paymentMethod,
    required bool isDeposit,
  }) async {
    final response = await apiClient.post(
      '$_baseUrl/checkout-payment',
      data: {
        'bookingIntentId': bookingIntentId,
        'paymentMethod': paymentMethod,
        'isDeposit': isDeposit,
      },
    );

    return response.data;
  }

  Future<dynamic> checkoutMatchJoin(
    String registrationId,
    String paymentMethod,
  ) async {
    final response = await apiClient.post(
      '$_baseUrl/checkout-match',
      data: {'registrationId': registrationId, 'paymentMethod': paymentMethod},
    );

    return response.data;
  }

  Future<dynamic> handleBookingPaymentResult({
    required String orderCode,
    required String status,
  }) async {
    final response = await apiClient.get(
      '$_baseUrl/result',
      queryParameters: {'orderCode': orderCode, 'status': status},
    );

    return response.data;
  }

  Future<dynamic> handleVnPayReturn(String queryString) async {
    final response = await apiClient.get('$_baseUrl/vnpay/return$queryString');

    return response.data;
  }

  Future<dynamic> uploadMatchPaymentProof({
    required String registrationId,
    required Uint8List imageBytes,
    required String fileName,
  }) async {
    try {
      if (registrationId.trim().isEmpty) {
        throw Exception('Mã đăng ký trận đấu không hợp lệ');
      }

      if (imageBytes.isEmpty) {
        throw Exception('Dữ liệu ảnh không hợp lệ');
      }

      final safeFileName = fileName.trim().isEmpty
          ? 'payment-proof.jpg'
          : fileName.trim();

      final formData = FormData.fromMap({
        'registrationId': registrationId,
        'file': MultipartFile.fromBytes(imageBytes, filename: safeFileName),
      });

      final response = await apiClient.post(
        '$_baseUrl/match/upload-proof',
        data: formData,
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(
        _getDioErrorMessage(e, fallback: 'Không thể tải ảnh chuyển khoản'),
      );
    }
  }

  String _getDioErrorMessage(DioException error, {required String fallback}) {
    final data = error.response?.data;

    if (data is Map) {
      final message = data['message'];
      final errorMessage = data['error'];

      if (message != null && message.toString().trim().isNotEmpty) {
        return message.toString();
      }

      if (errorMessage != null && errorMessage.toString().trim().isNotEmpty) {
        return errorMessage.toString();
      }
    }

    if (data is String && data.trim().isNotEmpty) {
      return data;
    }

    if (error.message != null && error.message!.trim().isNotEmpty) {
      return error.message!;
    }

    return fallback;
  }
}

final paymentService = PaymentService();
