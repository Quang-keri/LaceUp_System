import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

import '../config/api_client.dart';

class BookingService {
  dynamic _getResultOrData(dynamic data) {
    if (data is Map && data.containsKey('result')) {
      return data['result'];
    }

    return data;
  }

  Future<T> _execute<T>({
    required Future<T> Function() request,
    required String fallbackMessage,
  }) async {
    try {
      return await request();
    } on DioException {
      rethrow;
    }
  }

  Future<dynamic> getPendingTransferBookings(
    String rentalId, {
    int page = 1,
    int size = 10,
  }) {
    return _execute(
      fallbackMessage: 'Không thể tải danh sách đơn chờ xác nhận',
      request: () async {
        final response = await apiClient.get(
          '/bookings/intent/rental/$rentalId',
          queryParameters: {
            'status': 'PENDING_OWNER_CONFIRM',
            'page': page,
            'size': size,
          },
        );

        return response.data;
      },
    );
  }

  Future<dynamic> getMyBookingIntents() {
    return _execute(
      fallbackMessage: 'Không thể tải đơn chờ xác nhận',
      request: () async {
        final response = await apiClient.get('/bookings/intent/my-intents');

        final dynamic result = _getResultOrData(response.data);

        return result ?? [];
      },
    );
  }

  Future<dynamic> getBookingIntent(String bookingIntentId) {
    return _execute(
      fallbackMessage: 'Không thể tải thông tin thanh toán',
      request: () async {
        final response = await apiClient.get(
          '/bookings/intent/$bookingIntentId',
        );

        return _getResultOrData(response.data);
      },
    );
  }

  Future<dynamic> ownerConfirmBooking(String intentId) {
    return _execute(
      fallbackMessage: 'Không thể xác nhận yêu cầu đặt sân',
      request: () async {
        final response = await apiClient.post(
          '/bookings/intent/$intentId/owner-confirm',
        );

        return response.data;
      },
    );
  }

  Future<dynamic> ownerRejectBooking(String intentId) {
    return _execute(
      fallbackMessage: 'Không thể từ chối yêu cầu đặt sân',
      request: () async {
        final response = await apiClient.post(
          '/bookings/intent/$intentId/owner-reject',
        );

        return response.data;
      },
    );
  }

  Future<dynamic> createBookingIntent({
    String? userId,
    required String userName,
    required String userPhone,
    String note = '',
    required List<Map<String, dynamic>> slotRequests,
  }) {
    return _execute(
      fallbackMessage: 'Không thể tạo yêu cầu đặt sân',
      request: () async {
        final response = await apiClient.post(
          '/bookings/intent',
          data: {
            if (userId != null && userId.trim().isNotEmpty) 'userId': userId,
            'userName': userName,
            'userPhone': userPhone,
            'note': note,
            'slotRequests': slotRequests,
          },
        );

        return response.data;
      },
    );
  }

  Future<dynamic> createBooking({
    String? userId,
    required String userName,
    required String userPhone,
    String note = '',
    required List<Map<String, dynamic>> slotRequests,
  }) {
    return createBookingIntent(
      userId: userId,
      userName: userName,
      userPhone: userPhone,
      note: note,
      slotRequests: slotRequests,
    );
  }

  Future<dynamic> uploadPaymentProof({
    required String bookingIntentId,
    required XFile image,
  }) async {
    try {
      MultipartFile multipartFile;

      if (kIsWeb) {
        final bytes = await image.readAsBytes();
        multipartFile = MultipartFile.fromBytes(bytes, filename: image.name);
      } else {
        multipartFile = await MultipartFile.fromFile(
          image.path,
          filename: image.name,
        );
      }

      final formData = FormData.fromMap({'image': multipartFile});

      final response = await apiClient.post(
        '/bookings/intent/$bookingIntentId/payment-proof',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      return response.data;
    } on DioException {
      rethrow;
    } catch (error) {
      throw Exception('Upload ảnh thất bại: $error');
    }
  }

  Future<dynamic> uploadIntentPaymentProof({
    required String intentId,
    required XFile image,
  }) {
    return uploadPaymentProof(bookingIntentId: intentId, image: image);
  }

  Future<dynamic> previewOwnerBookingPrice({
    required List<Map<String, dynamic>> slots,
  }) {
    return _execute(
      fallbackMessage: 'Không thể tính trước giá đặt sân',
      request: () async {
        final response = await apiClient.post(
          '/bookings/preview-price',
          data: {'slots': slots},
        );

        return response.data;
      },
    );
  }

  Future<dynamic> createOwnerBooking({
    required String customerName,
    required String phone,
    String note = '',
    required num paidAmount,
    required String paymentMethod,
    String? bookingType,
    int? maxParticipants,
    required List<Map<String, dynamic>> slots,
  }) {
    return _execute(
      fallbackMessage: 'Không thể tạo booking',
      request: () async {
        final response = await apiClient.post(
          '/bookings/owner',
          data: {
            'customerName': customerName,
            'phone': phone,
            'note': note,
            'paidAmount': paidAmount,
            'paymentMethod': paymentMethod,
            if (bookingType != null && bookingType.trim().isNotEmpty)
              'bookingType': bookingType,
            if (maxParticipants != null) 'maxParticipants': maxParticipants,
            'slots': slots,
          },
        );

        return response.data;
      },
    );
  }

  Future<dynamic> getServicesByRentalArea(String rentalAreaId) {
    return _execute(
      fallbackMessage: 'Không thể tải danh sách dịch vụ',
      request: () async {
        final response = await apiClient.get(
          '/rental-areas/$rentalAreaId/services',
        );

        return response.data;
      },
    );
  }

  Future<dynamic> addExtraServices(
    String bookingId,
    List<Map<String, dynamic>> items,
  ) {
    return _execute(
      fallbackMessage: 'Không thể thêm dịch vụ vào booking',
      request: () async {
        final response = await apiClient.post(
          '/bookings/$bookingId/services',
          data: {'items': items},
        );

        return response.data;
      },
    );
  }

  Future<dynamic> checkAvailability({
    required String courtId,
    required String startTime,
    required String endTime,
    required int quantity,
  }) {
    return _execute(
      fallbackMessage: 'Không thể kiểm tra sân còn trống',
      request: () async {
        final response = await apiClient.post(
          '/bookings/check-availability',
          data: {
            'courtId': courtId,
            'startTime': startTime,
            'endTime': endTime,
            'quantity': quantity,
          },
        );

        return response.data;
      },
    );
  }

  Future<dynamic> getBookingById(String bookingId) {
    return _execute(
      fallbackMessage: 'Không thể tải thông tin booking',
      request: () async {
        final response = await apiClient.get('/bookings/$bookingId');

        return response.data;
      },
    );
  }

  Future<dynamic> getPublicSharedBooking(String bookingId) {
    return _execute(
      fallbackMessage: 'Không thể tải thông tin vãng lai',
      request: () async {
        final response = await apiClient.get(
          '/bookings/shared/$bookingId/public',
        );

        return response.data;
      },
    );
  }

  Future<dynamic> updateBooking(
    String bookingId,
    Map<String, dynamic> payload,
  ) {
    return _execute(
      fallbackMessage: 'Không thể cập nhật booking',
      request: () async {
        final response = await apiClient.put(
          '/bookings/$bookingId',
          data: payload,
        );

        return response.data;
      },
    );
  }

  Future<dynamic> cancelBooking(String bookingId) {
    return _execute(
      fallbackMessage: 'Không thể hủy đặt sân',
      request: () async {
        final response = await apiClient.put('/bookings/$bookingId/cancel');

        return response.data;
      },
    );
  }

  Future<dynamic> collectRemainingPayment(String bookingId) {
    return _execute(
      fallbackMessage: 'Không thể xác nhận thanh toán còn lại',
      request: () async {
        final response = await apiClient.put(
          '/bookings/$bookingId/collect-payment',
        );

        return response.data;
      },
    );
  }

  Future<dynamic> getBookingsByRentalArea(
    String rentalAreaId, {
    int page = 1,
    int size = 10,
    String? status,
    String? bookingType,
    String? searchKeyword,
    String? from,
    String? to,
  }) {
    return _execute(
      fallbackMessage: 'Không thể tải danh sách booking của sân',
      request: () async {
        final response = await apiClient.get(
          '/bookings/my-rentals',
          queryParameters: {
            'rentalId': rentalAreaId,
            'page': page,
            'size': size,
            'keyword': searchKeyword ?? '',
            if (status != null && status.isNotEmpty) 'bookingStatus': status,
            if (bookingType != null && bookingType.isNotEmpty)
              'bookingType': bookingType,
            if (from != null && from.isNotEmpty) 'from': from,
            if (to != null && to.isNotEmpty) 'to': to,
          },
        );

        return response.data;
      },
    );
  }

  Future<dynamic> getMyBookings(
    String? status,
    String? fromDate,
    String? toDate,
    String? keyword,
    int page,
    int size, {
    String? bookingType,
  }) {
    return getMyBookingsFiltered(
      status: status,
      bookingType: bookingType,
      searchKeyword: keyword,
      from: fromDate,
      to: toDate,
      page: page,
      size: size,
    );
  }

  Future<dynamic> getMyBookingsFiltered({
    String? status,
    String? bookingType,
    String? searchKeyword,
    String? from,
    String? to,
    int page = 1,
    int size = 10,
  }) {
    return _execute(
      fallbackMessage: 'Không thể tải lịch sử đặt sân',
      request: () async {
        final response = await apiClient.get(
          '/bookings/my-bookings',
          queryParameters: {
            'page': page,
            'size': size,
            'keyword': searchKeyword ?? '',
            if (status != null && status.isNotEmpty) 'bookingStatus': status,
            if (bookingType != null && bookingType.isNotEmpty)
              'bookingType': bookingType,
            if (from != null && from.isNotEmpty) 'from': from,
            if (to != null && to.isNotEmpty) 'to': to,
          },
        );

        return _getResultOrData(response.data) ?? response.data;
      },
    );
  }

  Future<dynamic> getAllBookings({
    int page = 1,
    int size = 10,
    String? status,
    String? bookingType,
    String? keyword,
    String? from,
    String? to,
  }) {
    return _execute(
      fallbackMessage: 'Không thể tải danh sách booking',
      request: () async {
        final response = await apiClient.get(
          '/bookings',
          queryParameters: {
            'page': page,
            'size': size,
            if (status != null && status.isNotEmpty) 'bookingStatus': status,
            if (bookingType != null && bookingType.isNotEmpty)
              'bookingType': bookingType,
            if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
            if (from != null && from.isNotEmpty) 'from': from,
            if (to != null && to.isNotEmpty) 'to': to,
          },
        );

        return response.data;
      },
    );
  }

  Future<dynamic> joinSharedBooking(String bookingId, int quantity) {
    return _execute(
      fallbackMessage: 'Không thể tham gia booking',
      request: () async {
        final response = await apiClient.post(
          '/bookings/shared/$bookingId/join',
          data: {'quantity': quantity},
        );

        return response.data;
      },
    );
  }

  Future<dynamic> getTicketParticipant(String participantId) {
    return _execute(
      fallbackMessage: 'Không thể tải thông tin vé',
      request: () async {
        final response = await apiClient.get(
          '/bookings/shared/ticket/$participantId',
        );

        return response.data;
      },
    );
  }

  Future<dynamic> uploadTicketPaymentProof({
    required String participantId,
    required XFile image,
  }) async {
    try {
      MultipartFile multipartFile;

      if (kIsWeb) {
        final bytes = await image.readAsBytes();

        multipartFile = MultipartFile.fromBytes(bytes, filename: image.name);
      } else {
        multipartFile = await MultipartFile.fromFile(
          image.path,
          filename: image.name,
        );
      }

      final formData = FormData.fromMap({'image': multipartFile});

      final response = await apiClient.post(
        '/bookings/shared/ticket/$participantId/payment-proof',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      return response.data;
    } on DioException {
      rethrow;
    } catch (error) {
      throw Exception('Không thể upload ảnh thanh toán vé: $error');
    }
  }

  Future<List<int>> downloadInvoice(String bookingId) {
    return _execute(
      fallbackMessage: 'Không thể tải hóa đơn',
      request: () async {
        final Response<List<int>> response = await apiClient.get<List<int>>(
          '/bookings/$bookingId/invoice/download',
          options: Options(responseType: ResponseType.bytes),
        );

        return response.data ?? <int>[];
      },
    );
  }

  Future<List<int>> exportBookingsExcel({
    String? rentalId,
    String? bookingStatus,
    String? bookingType,
    String? keyword,
    String? from,
    String? to,
  }) {
    return _execute(
      fallbackMessage: 'Không thể xuất file Excel',
      request: () async {
        final Response<List<int>> response = await apiClient.get<List<int>>(
          '/bookings/export/excel',
          queryParameters: {
            if (rentalId != null && rentalId.isNotEmpty) 'rentalId': rentalId,
            if (bookingStatus != null && bookingStatus.isNotEmpty)
              'bookingStatus': bookingStatus,
            if (bookingType != null && bookingType.isNotEmpty)
              'bookingType': bookingType,
            if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
            if (from != null && from.isNotEmpty) 'from': from,
            if (to != null && to.isNotEmpty) 'to': to,
          },
          options: Options(responseType: ResponseType.bytes),
        );

        return response.data ?? <int>[];
      },
    );
  }

  Future<dynamic> cancelSharedTicketByUser(String participantId) {
    return _execute(
      fallbackMessage: 'Không thể hủy vé vãng lai',
      request: () async {
        final response = await apiClient.put(
          '/bookings/shared/ticket/$participantId/cancel',
        );

        return response.data;
      },
    );
  }
}

final bookingService = BookingService();
