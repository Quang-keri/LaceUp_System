import 'package:dio/dio.dart';
import '../config/api_client.dart';

class PaymentService {
  final String _baseUrl = '/payments';

  Future<dynamic> checkoutPayment({
    required String bookingIntentId,
    required String paymentMethod,
    required bool isDeposit,
  }) async {
    try {
      final response = await apiClient.post(
        '$_baseUrl/checkout-payment',
        data: {
          'bookingIntentId': bookingIntentId,
          'paymentMethod': paymentMethod,
          'isDeposit': isDeposit,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<dynamic> checkoutMatchJoin(
      String registrationId,
      String paymentMethod,
      ) async {
    try {
      final response = await apiClient.post(
        '$_baseUrl/checkout-match',
        data: {
          'registrationId': registrationId,
          'paymentMethod': paymentMethod,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<dynamic> handleBookingPaymentResult({
    required String orderCode,
    required String status,
  }) async {
    try {
      final response = await apiClient.get(
        '$_baseUrl/result',
        queryParameters: {
          'orderCode': orderCode,
          'status': status,
        },
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<dynamic> handleVnPayReturn(String queryString) async {
    try {
      final response = await apiClient.get('$_baseUrl/vnpay/return$queryString');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<dynamic> uploadMatchPaymentProof({
    required String registrationId,
    required String imagePath,
  }) async {
    try {
      FormData formData = FormData.fromMap({
        'registrationId': registrationId,
        'file': await MultipartFile.fromFile(imagePath),
      });

      final response = await apiClient.post(
        '$_baseUrl/match/upload-proof',
        data: formData,
      );
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
}

final paymentService = PaymentService();