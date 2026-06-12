import 'package:dio/dio.dart';

import '../config/api_client.dart';
import '../models/booking_share.dart';

class SharedBookingService {
  String _errorMessage(DioException error, String fallback) {
    final data = error.response?.data;

    if (data is Map) {
      final message = data['message']?.toString().trim();

      if (message != null && message.isNotEmpty) {
        return message;
      }
    }

    if (data is String && data.trim().isNotEmpty) {
      return data.trim();
    }

    return error.message ?? fallback;
  }

  Future<List<SharedBookingPublicResponse>> getOpenSharedBookingsForCommunity({
    int page = 1,
    int size = 100,
    String? rentalAreaId,
  }) async {
    try {
      final response = await apiClient.get(
        '/bookings/shared/community',
        queryParameters: {
          'page': page,
          'size': size,
          if (rentalAreaId != null && rentalAreaId.trim().isNotEmpty)
            'rentalAreaId': rentalAreaId,
        },
      );

      final rawResponse = response.data;

      final dynamic result =
          rawResponse is Map && rawResponse.containsKey('result')
          ? rawResponse['result']
          : rawResponse;

      final dynamic rawData = result is Map && result.containsKey('data')
          ? result['data']
          : result;

      if (rawData is! List) {
        return <SharedBookingPublicResponse>[];
      }

      return rawData
          .whereType<Map>()
          .map(
            (item) => SharedBookingPublicResponse.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList();
    } on DioException catch (error) {
      throw Exception(
        _errorMessage(error, 'Không thể tải danh sách trận vãng lai'),
      );
    }
  }

  Future<dynamic> joinSharedBooking({
    required String bookingId,
    required int quantity,
  }) async {
    try {
      final response = await apiClient.post(
        '/bookings/shared/$bookingId/join',
        data: {'quantity': quantity},
      );

      return response.data;
    } on DioException catch (error) {
      throw Exception(_errorMessage(error, 'Không thể tham gia trận vãng lai'));
    }
  }

  Future<dynamic> cancelSharedTicketByUser(String participantId) async {
    try {
      final response = await apiClient.put(
        '/bookings/shared/ticket/$participantId/cancel',
      );
      return response.data;
    } on DioException catch (error) {
      throw Exception(_errorMessage(error, 'Không thể hủy vé vãng lai'));
    }
  }
}

final sharedBookingService = SharedBookingService();
